export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  redis: { host: string; port: number; url: string };
  rabbitmq: { host: string; port: number; url: string };
  jwt: { secret: string; expiresIn: string };
}

export default (): AppConfig => ({
  port: Number.parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  rabbitmq: {
    host: process.env.RABBITMQ_HOST ?? 'localhost',
    port: Number.parseInt(process.env.RABBITMQ_PORT ?? '5672', 10),
    url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
});
