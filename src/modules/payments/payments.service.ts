import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import Stripe from 'stripe';
import type {
  CreatePaymentRequest,
  ProcessPaymentEventRequest,
  ProcessStripePaymentEventRequest,
  ProcessStripePaymentEventResponse,
} from '@dimgit9/contracts/gen/ts/payment';
import { RpcStatus } from '@dimgit9/common';

import { StripeService } from '@/infra/stripe/stripe.service';
import { BookingClientGrpc } from '@/clients/booking-client.grpc';
import { PaymentRepository } from './payment.repository';

type StripeClient = InstanceType<typeof Stripe>;
type CheckoutSession = Awaited<
  ReturnType<StripeClient['checkout']['sessions']['retrieve']>
>;

@Injectable()
export class PaymentsService {
  private readonly HOSTS_APP: string;
  private readonly STRIPE_WEBHOOK_SECRET: string;

  constructor(
    private readonly repository: PaymentRepository,
    private readonly configService: ConfigService,
    private readonly stripeService: StripeService,
    private readonly bookingClient: BookingClientGrpc,
  ) {
    this.HOSTS_APP = this.configService.getOrThrow<string>('HOSTS_APP');
    this.STRIPE_WEBHOOK_SECRET = this.configService.getOrThrow<string>(
      'STRIPE_WEBHOOK_SECRET',
    );
  }

  async createPayment(data: CreatePaymentRequest) {
    const { userId, seanceId, savePaymentMethod, seats } = data;

    const reservation = await lastValueFrom(
      this.bookingClient.createReservation({
        userId,
        seanceId,
        seats,
      }),
    );

    const payment = await this.repository.createPayment({
      amount: reservation.amount,
      userId,
      bookingId: reservation.orderId,
    });

    const providerSession =
      await this.stripeService.instance.checkout.sessions.create({
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Tickets for seance ${seanceId}`,
              },
              unit_amount: reservation.amount * 100,
            },
            quantity: 1,
          },
        ],
        success_url: `${this.HOSTS_APP}/account/tickets`,
        cancel_url: `${this.HOSTS_APP}/account/tickets?status=failed`,
        payment_intent_data: {
          setup_future_usage: savePaymentMethod ? 'off_session' : undefined,
        },
        metadata: {
          payment_id: payment.id,
          user_id: userId,
          seance_id: seanceId,
          booking_id: reservation.orderId,
        },
      });

    await this.repository.updatePayment(payment.id, {
      providerId: providerSession.id,
      metadata: JSON.stringify(providerSession),
    });

    return {
      url: providerSession.url ?? `${this.HOSTS_APP}/account/tickets/callback`,
    };
  }

  async processPaymentEvent(
    data: ProcessPaymentEventRequest,
  ): Promise<ProcessStripePaymentEventResponse> {
    const { event, paymentId, providerMethodId, bookingId, userId } = data;

    const payment = await this.repository.findPaymentById(paymentId);

    if (!payment)
      throw new RpcException({
        code: RpcStatus.NOT_FOUND,
        details: 'Payment not found',
      });

    if (event === 'checkout.session.completed') {
      await this.repository.updatePayment(paymentId, {
        status: 'SUCCESS',
        providerId: providerMethodId,
      });

      await lastValueFrom(
        this.bookingClient.confirmBooking({
          bookingId,
          userId,
        }),
      );
      return { ok: true };
    } else if (event === 'checkout.session.expired') {
      await this.repository.updatePayment(paymentId, {
        status: 'FAILED',
        providerId: providerMethodId,
      });
    }

    return { ok: false };
  }

  async processStripePaymentEvent(data: ProcessStripePaymentEventRequest) {
    const event = this.stripeService.instance.webhooks.constructEvent(
      Buffer.from(data.rawBody),
      data.signature,
      this.STRIPE_WEBHOOK_SECRET,
    );

    if (
      event.type !== 'checkout.session.completed' &&
      event.type !== 'checkout.session.expired'
    ) {
      return { ok: false };
    }

    const session =
      await this.stripeService.instance.checkout.sessions.retrieve(
        event.data.object.id,
        {
          expand: ['payment_intent.payment_method'],
        },
      );

    if (
      event.type === 'checkout.session.completed' &&
      session.metadata?.save_payment_method === 'true'
    ) {
      await this.savePaymentMethodFromSession(session);
    }

    return await this.processPaymentEvent({
      event: event.type,
      paymentId: session.metadata?.payment_id ?? '',
      bookingId: session.metadata?.booking_id ?? '',
      userId: session.metadata?.user_id ?? '',
      savePaymentMethod: session.metadata?.save_payment_method === 'true',
      providerMethodId:
        typeof event.data.object.payment_intent === 'string'
          ? event.data.object.payment_intent
          : session.id,
      cardFirst6: '',
      cardLast4: '',
    });
  }

  private async savePaymentMethodFromSession(
    session: CheckoutSession,
  ): Promise<void> {
    const userId = session.metadata?.user_id;
    if (!userId) return;

    const paymentIntentRef = session.payment_intent;
    if (!paymentIntentRef || typeof paymentIntentRef !== 'string') return;

    const paymentIntent =
      await this.stripeService.instance.paymentIntents.retrieve(
        paymentIntentRef,
      );

    const paymentMethodRef = paymentIntent.payment_method;
    if (!paymentMethodRef || typeof paymentMethodRef !== 'string') return;

    const paymentMethod =
      await this.stripeService.instance.paymentMethods.retrieve(
        paymentMethodRef,
      );

    if (paymentMethod.type !== 'card' || !paymentMethod.card) return;

    const existing = await this.repository.findActivePaymentMethod(
      userId,
      paymentMethod.id,
    );

    if (!existing)
      await this.repository.createPaymentMethod({
        userId,
        providerId: paymentMethod.id,
        type: paymentMethod.type,
        status: 'ACTIVE',
        brand: paymentMethod.card.brand ?? null,
        first6: null,
        last4: paymentMethod.card.last4 ?? null,
      });
  }
}
