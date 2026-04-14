import { PrismaService } from '@/infra/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { PaymentStatus, RefundStatus } from '@prisma/generated/enums';
import { RefundCreateInput, RefundUpdateInput } from '@prisma/generated/models';

@Injectable()
export class RefundRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findRefundByProviderId(providerId: string) {
    return this.prismaService.refund.findFirst({
      where: {
        providerId,
      },
      include: {
        payment: true,
      },
    });
  }

  findPaymentByBookingId(bookingId: string) {
    return this.prismaService.payment.findFirst({
      where: { bookingId },
    });
  }

  createRefund(data: RefundCreateInput) {
    return this.prismaService.refund.create({
      data,
    });
  }

  updateRefund(id: string, data: RefundUpdateInput) {
    return this.prismaService.refund.update({
      where: { id },
      data,
    });
  }

  markRefundFailed(id: string) {
    return this.prismaService.refund.update({
      where: {
        id,
      },
      data: {
        status: RefundStatus.FAILED,
      },
    });
  }

  markRefundSuccess(id: string) {
    return this.prismaService.refund.update({
      where: {
        id,
      },
      data: {
        status: RefundStatus.SUCCESS,
      },
    });
  }

  markPaymentRefunded(id: string) {
    return this.prismaService.payment.update({
      where: {
        id,
      },
      data: {
        status: PaymentStatus.REFUNDED,
      },
    });
  }
}
