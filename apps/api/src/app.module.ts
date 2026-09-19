import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TraceIdMiddleware } from './common/middleware/trace-id.middleware';
import configuration from './config/configuration';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { BrandsModule } from './modules/brands/brands.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { AfterSalesModule } from './modules/after-sales/after-sales.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SearchModule } from './modules/search/search.module';
import { PrismaModule } from './prisma/prisma.module';
import { RabbitMQModule } from './rabbitmq/rabbitmq.module';
import { RedisModule } from './redis/redis.module';

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
      load: [configuration],
    }),
    ClsModule.forRoot({ global: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: isProduction ? 'info' : 'debug',
        transport:
          isProduction || isTest
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:standard' } },
        redact: ['req.headers.authorization'],
        genReqId: (req) => (req as { id?: string }).id ?? randomUUID(),
      },
    }),
    PrismaModule,
    RedisModule,
    RabbitMQModule,
    AuthModule,
    HealthModule,
    UsersModule,
    AddressesModule,
    CategoriesModule,
    BrandsModule,
    SearchModule,
    ProductsModule,
    CartModule,
    CouponsModule,
    PromotionsModule,
    OrdersModule,
    ReviewsModule,
    LogisticsModule,
    PaymentsModule,
    AfterSalesModule,
  ],
  providers: [
    TraceIdMiddleware,
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
