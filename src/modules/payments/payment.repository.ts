import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/infra/prisma/prisma.service';
import type {
  PaymentUpdateInput,
  PaymentCreateInput,
  PaymentMethodUpdateInput,
  PaymentMethodCreateInput,
} from '@prisma/generated/models';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prismaService: PrismaService) {}

  createPayment(data: PaymentCreateInput) {
    return this.prismaService.payment.create({ data });
  }

  findPaymentById(id: string) {
    return this.prismaService.payment.findUnique({ where: { id } });
  }

  updatePayment(id: string, data: PaymentUpdateInput) {
    return this.prismaService.payment.update({
      where: {
        id,
      },
      data,
    });
  }

  createPaymentMethod(data: PaymentMethodCreateInput) {
    return this.prismaService.paymentMethod.create({ data });
  }

  findPaymentMethodById(id: string) {
    return this.prismaService.payment.findUnique({ where: { id } });
  }

  findActivePaymentMethod(userId: string, providerId: string) {
    return this.prismaService.paymentMethod.findFirst({
      where: {
        userId,
        providerId,
        status: 'ACTIVE',
      },
    });
  }

  updatePaymentMethod(id: string, data: PaymentMethodUpdateInput) {
    return this.prismaService.paymentMethod.update({
      where: {
        id,
      },
      data,
    });
  }
}
