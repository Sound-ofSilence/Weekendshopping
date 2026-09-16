import { Global, Module } from '@nestjs/common';
import { RabbitMQModule as GolevelupRabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({
  imports: [
    GolevelupRabbitMQModule.forRootAsync(GolevelupRabbitMQModule, {
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [],
        uri: configService.get<string>('rabbitmq.url') ?? 'amqp://localhost:5672',
        connectionInitOptions: { wait: false, timeout: 5000 },
      }),
    }),
  ],
  providers: [RabbitMQService],
  exports: [GolevelupRabbitMQModule, RabbitMQService],
})
export class RabbitMQModule {}
