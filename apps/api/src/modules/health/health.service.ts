import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { RedisService } from '../../redis/redis.service';
import { ComponentHealth, HealthResponse } from './dto/health-response.dto';

const CHECK_TIMEOUT_MS = 3000;

type ComponentName = 'database' | 'redis' | 'rabbitmq';
type RawResult = { status: 'up' } | { status: 'down'; error: string };

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitMQService,
  ) {}

  async check(): Promise<HealthResponse> {
    const [database, redis, rabbitmq] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkRabbitmq(),
    ]);

    const status: HealthResponse['status'] = [database, redis, rabbitmq].every((c) => c.status === 'up')
      ? 'ok'
      : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      components: { database, redis, rabbitmq },
    };
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    return this.withTimeout(async (): Promise<RawResult> => {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    }, 'database');
  }

  private async checkRedis(): Promise<ComponentHealth> {
    return this.withTimeout(async (): Promise<RawResult> => {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') {
        return { status: 'down', error: 'unexpected ping response' };
      }
      return { status: 'up' };
    }, 'redis');
  }

  private async checkRabbitmq(): Promise<ComponentHealth> {
    return this.withTimeout(async (): Promise<RawResult> => {
      if (this.rabbitmq.isConnected()) {
        return { status: 'up' };
      }
      return { status: 'down', error: 'not connected' };
    }, 'rabbitmq');
  }

  private async withTimeout(fn: () => Promise<RawResult>, name: ComponentName): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`timeout after ${CHECK_TIMEOUT_MS}ms`)), CHECK_TIMEOUT_MS);
        }),
      ]);
      return { ...result, latencyMs: Date.now() - start };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      this.logger.error(`health check failed for ${name}: ${message}`);
      return { status: 'down', latencyMs: Date.now() - start, error: message };
    }
  }
}
