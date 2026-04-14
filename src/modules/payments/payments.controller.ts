import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  ProcessPaymentEventRequest,
  ProcessPaymentEventResponse,
  ProcessStripePaymentEventRequest,
  ProcessStripePaymentEventResponse,
} from '@dimgit9/contracts/gen/ts/payment';

import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @GrpcMethod('PaymentService', 'CreatePayment')
  async createPayment(
    data: CreatePaymentRequest,
  ): Promise<CreatePaymentResponse> {
    return this.paymentsService.createPayment(data);
  }

  @GrpcMethod('PaymentService', 'ProcessPaymentEvent')
  async processPaymentEvent(
    data: ProcessPaymentEventRequest,
  ): Promise<ProcessPaymentEventResponse> {
    return this.paymentsService.processPaymentEvent(data);
  }

  @GrpcMethod('PaymentService', 'ProcessStripePaymentEvent')
  async processStripePaymentEvent(
    data: ProcessStripePaymentEventRequest,
  ): Promise<ProcessStripePaymentEventResponse> {
    return this.paymentsService.processStripePaymentEvent(data);
  }
}
