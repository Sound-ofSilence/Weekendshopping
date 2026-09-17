import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { SellerProductsController } from './seller-products.controller';
import { SellerProductsService } from './seller-products.service';

@Module({
  controllers: [ProductsController, SellerProductsController],
  providers: [ProductsService, SellerProductsService],
})
export class ProductsModule {}