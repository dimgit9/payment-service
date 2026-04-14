import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  CreateRefundRequest,
  CreateRefundResponse,
  ProcessRefundEventRequest,
  ProcessRefundEventResponse,
} from '@dimgit9/contracts/gen/ts/refund';
import { RefundService } from './refund.service';

@Controller()
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @GrpcMethod('RefundService', 'CreateRefund')
  async createRefund(data: CreateRefundRequest): Promise<CreateRefundResponse> {
    return this.refundService.createRefund(data);
  }

  @GrpcMethod('RefundService', 'ProcessRefundEvent')
  async processRefundEvent(
    data: ProcessRefundEventRequest,
  ): Promise<ProcessRefundEventResponse> {
    return this.refundService.processRefundEvent(data);
  }
}
