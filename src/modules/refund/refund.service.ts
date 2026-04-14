import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  CreateRefundRequest,
  ProcessRefundEventRequest,
} from '@dimgit9/contracts/gen/ts/refund';
import { RpcStatus } from '@dimgit9/common';

import { BookingClientGrpc } from '@/clients/booking-client.grpc';
import { StripeService } from '@/infra/stripe/stripe.service';
import { RefundRepository } from './refund.repository';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RefundService {
  constructor(
    private readonly repository: RefundRepository,
    private readonly stripeService: StripeService,
    private readonly bookingClient: BookingClientGrpc,
  ) {}

  async createRefund(data: CreateRefundRequest) {
    const { userId, bookingId } = data;

    const payment = await this.repository.findPaymentByBookingId(bookingId);

    if (!payment || payment.userId !== userId)
      throw new RpcException({
        code: RpcStatus.NOT_FOUND,
        details: 'Payment not found',
      });

    const refund = await this.repository.createRefund({
      amount: payment.amount,
      payment: { connect: { id: payment.id } },
    });

    const stripeRefund = await this.stripeService.instance.refunds.create({
      payment_intent: payment.providerId ?? undefined,
      amount: Math.round(payment.amount),
      reason: 'requested_by_customer',
      metadata: {
        refund_id: refund.id,
        payment_id: payment.id,
        booking_id: bookingId,
        user_id: userId,
      },
    });

    await this.repository.updateRefund(refund.id, {
      providerId: stripeRefund.id,
    });

    return { ok: true };
  }

  async processRefundEvent(data: ProcessRefundEventRequest) {
    const { event, providerRefundId, status } = data;

    const refund =
      await this.repository.findRefundByProviderId(providerRefundId);

    if (!refund)
      throw new RpcException({
        code: RpcStatus.NOT_FOUND,
        details: 'Refund not found',
      });

    try {
      switch (event) {
        case 'refund.created':
        case 'refund.updated': {
          if (status === 'succeeded') {
            await this.repository.markRefundSuccess(refund.id);
            await this.repository.markPaymentRefunded(refund.paymentId);

            await lastValueFrom(
              this.bookingClient.cancelBooking({
                bookingId: refund.payment.bookingId,
                userId: refund.payment.userId,
              }),
            );
          } else if (status === 'failed' || status === 'canceled') {
            await this.repository.markRefundFailed(refund.id);
          }

          break;
        }

        case 'refund.failed': {
          await this.repository.markRefundFailed(refund.id);
          break;
        }

        default:
          break;
      }

      return { ok: true };
    } catch (error) {
      console.log('processRefundEvent.error:', error);

      throw new RpcException({
        code: RpcStatus.INTERNAL,
        details: 'Failed to process refund event',
      });
    }
  }
}
