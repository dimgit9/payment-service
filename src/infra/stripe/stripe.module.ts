import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { StripeService } from './stripe.service';
import { STRIPE } from './stripe.constants';
import { getStripeConfig } from '../config/stripe.config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    StripeService,
    {
      provide: STRIPE,
      useFactory: getStripeConfig,
      inject: [ConfigService],
    },
  ],
  exports: [StripeService, STRIPE],
})
export class StripeModule {}
