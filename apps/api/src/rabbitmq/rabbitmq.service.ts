import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class RabbitMQService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  isConnected(): boolean {
    try {
      return this.amqpConnection.managedConnection.isConnected();
    } catch {
      return false;
    }
  }

  async publish(exchange: string, routingKey: string, message: unknown): Promise<void> {
    await this.amqpConnection.publish(exchange, routingKey, message);
  }
}
