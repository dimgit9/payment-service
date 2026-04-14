import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PaymentsModule } from './modules/payments/payments.module';
import { PrismaModule } from './infra/prisma/prisma.module';
import { StripeModule } from './infra/stripe/stripe.module';
import { RefundModule } from './modules/refund/refund.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        '.env',
      ],
      isGlobal: true,
    }),
    PrismaModule,
    StripeModule,

    PaymentsModule,
    RefundModule,
  ],
})
export class AppModule {}
