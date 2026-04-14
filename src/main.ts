import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { PROTO_PATHS } from '@dimgit9/contracts';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const host = configService.getOrThrow<string>('GRPC_HOST');
  const port = configService.getOrThrow<number>('GRPC_PORT');

  const url = `${host}:${port}`;

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: ['payment.v1', 'refund.v1'],
      protoPath: [PROTO_PATHS.PAYMENT, PROTO_PATHS.REFUND],
      url,
      loader: {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  app.startAllMicroservices();
  app.init();
}
bootstrap();
