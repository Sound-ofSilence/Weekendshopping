import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TraceIdMiddleware } from '../src/common/middleware/trace-id.middleware';
import { PrismaService } from '../src/prisma/prisma.service';
import { RabbitMQService } from '../src/rabbitmq/rabbitmq.service';
import { RedisService } from '../src/redis/redis.service';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  const prismaMock = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
  const redisMock = { ping: jest.fn().mockResolvedValue('PONG') };
  const rabbitmqMock = { isConnected: jest.fn().mockReturnValue(true) };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(RedisService)
      .useValue(redisMock)
      .overrideProvider(RabbitMQService)
      .useValue(rabbitmqMock)
      .compile();

    app = moduleRef.createNestApplication();

    // 注册 traceId 中间件（与 main.ts 保持一致），确保请求能写入 CLS
    const traceIdMiddleware = app.get(TraceIdMiddleware);
    app.use(traceIdMiddleware.use.bind(traceIdMiddleware));

    await app.init();
  });

  afterAll(async () => {
    // 关闭 RabbitMQ 连接（golevelup 模块内部的 amqp-connection-manager 连接），避免 Jest 无法退出
    try {
      const amqpConnection = app.get(AmqpConnection);
      await amqpConnection.managedConnection.close();
    } catch {
      // 连接可能尚未建立，忽略关闭异常
    }
    await app.close();
  });

  it('GET /health returns unified response with traceId', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toMatchObject({
      code: 0,
      message: 'success',
    });
    expect(typeof response.body.traceId).toBe('string');
    expect(response.body.traceId.length).toBeGreaterThan(0);
    expect(response.body.data).toMatchObject({
      status: 'ok',
      components: {
        database: { status: 'up' },
        redis: { status: 'up' },
        rabbitmq: { status: 'up' },
      },
    });
    expect(response.headers['x-trace-id']).toBe(response.body.traceId);
  });
});
