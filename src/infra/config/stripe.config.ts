import { ConfigService } from '@nestjs/config';

export type StripeConfig = {
  apiKey: string;
  webhookSecret: string;
};

export function getStripeConfig(configService: ConfigService) {
  const apiKey = configService.getOrThrow<string>('STRIPE_API_KEY');
  const webhookSecret = configService.getOrThrow<string>(
    'STRIPE_WEBHOOK_SECRET',
  );

  return {
    apiKey,
    webhookSecret,
  };
}
