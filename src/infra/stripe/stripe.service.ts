import Stripe from 'stripe';

import { Inject, Injectable } from '@nestjs/common';
import { STRIPE } from './stripe.constants';
import type { StripeConfig } from '../config/stripe.config';

type StripeClient = InstanceType<typeof Stripe>;

@Injectable()
export class StripeService {
  private stripe: StripeClient;

  constructor(
    @Inject(STRIPE)
    private readonly config: StripeConfig,
  ) {
    this.stripe = new Stripe(this.config.apiKey, {
      apiVersion: '2026-03-25.dahlia',
    });
  }

  get instance(): StripeClient {
    return this.stripe;
  }

  get webhookSecret(): string {
    return this.config.webhookSecret;
  }
}
