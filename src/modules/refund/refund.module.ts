import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PROTO_PATHS } from '@dimgit9/contracts';

import { RefundService } from './refund.service';
import { RefundController } from './refund.controller';
import { RefundRepository } from './refund.repository';
import { BookingClientGrpc } from '@/clients/booking-client.grpc';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'BOOKING_PACKAGE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'booking.v1',
            protoPath: PROTO_PATHS.BOOKING,
            url: configService.getOrThrow<string>('BOOKING_GRPC_URL'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [RefundController],
  providers: [RefundService, RefundRepository, BookingClientGrpc],
})
export class RefundModule {}
