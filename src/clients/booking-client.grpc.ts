import { Inject, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';

import type {
  BookingServiceClient,
  CancelBookingRequest,
  ConfirmBookingRequest,
  CreateReservationRequest,
} from '@dimgit9/contracts/gen/ts/booking';

export class BookingClientGrpc implements OnModuleInit {
  private service!: BookingServiceClient;

  constructor(
    @Inject('BOOKING_PACKAGE')
    private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.service =
      this.client.getService<BookingServiceClient>('BookingService');
  }

  createReservation(data: CreateReservationRequest) {
    return this.service.createReservation(data);
  }

  confirmBooking(data: ConfirmBookingRequest) {
    return this.service.confirmBooking(data);
  }

  cancelBooking(data: CancelBookingRequest) {
    return this.service.cancelBooking(data);
  }
}
