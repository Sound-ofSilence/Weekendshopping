import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { ProductDetailResponseDto, SkuResponseDto } from './dto/product-response.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get(':spuId')
  @ApiOperation({ summary: '商品详情（含 SKU、规格）' })
  detail(@Param('spuId', ParseIntPipe) spuId: number): Promise<ProductDetailResponseDto> {
    return this.productsService.detail(spuId);
  }

  @Public()
  @Get(':spuId/skus')
  @ApiOperation({ summary: 'SKU 列表' })
  skus(@Param('spuId', ParseIntPipe) spuId: number): Promise<SkuResponseDto[]> {
    return this.productsService.skus(spuId);
  }
}