import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { Role } from '../../common/constants/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { BatchProductIdsDto } from './dto/batch-product-ids.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { GenerateSkusDto } from './dto/generate-skus.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductDetailResponseDto, ProductListItemResponseDto } from './dto/product-response.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SellerProductsService } from './seller-products.service';

@ApiTags('seller-products')
@Roles(Role.MERCHANT)
@Controller('seller/products')
export class SellerProductsController {
  constructor(private readonly sellerProductsService: SellerProductsService) {}

  @Get()
  @ApiOperation({ summary: '商家商品列表（分页、筛选）' })
  list(@Query() query: ProductQueryDto): Promise<PaginatedResponseDto<ProductListItemResponseDto>> {
    return this.sellerProductsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: '发布商品（草稿）' })
  create(@Body() dto: CreateProductDto): Promise<ProductDetailResponseDto> {
    return this.sellerProductsService.create(dto);
  }

  @Post('generate-skus')
  @ApiOperation({ summary: '根据规格组生成笛卡尔积 SKU 列表' })
  generateSkus(@Body() dto: GenerateSkusDto): Record<string, string>[] {
    return this.sellerProductsService.generateSkus(dto.specs ?? []);
  }

  @Post('batch-on-sale')
  @ApiOperation({ summary: '批量上架' })
  async batchOnSale(@Body() dto: BatchProductIdsDto): Promise<null> {
    await this.sellerProductsService.batchOnSale(dto.ids);
    return null;
  }

  @Post('batch-off-sale')
  @ApiOperation({ summary: '批量下架' })
  async batchOffSale(@Body() dto: BatchProductIdsDto): Promise<null> {
    await this.sellerProductsService.batchOffSale(dto.ids);
    return null;
  }

  @Put(':id')
  @ApiOperation({ summary: '编辑商品' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto): Promise<ProductDetailResponseDto> {
    return this.sellerProductsService.update(id, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交审核' })
  async submit(@Param('id', ParseIntPipe) id: number): Promise<null> {
    await this.sellerProductsService.submit(id);
    return null;
  }

  @Post(':id/on-sale')
  @ApiOperation({ summary: '上架' })
  async onSale(@Param('id', ParseIntPipe) id: number): Promise<null> {
    await this.sellerProductsService.onSale(id);
    return null;
  }

  @Post(':id/off-sale')
  @ApiOperation({ summary: '下架' })
  async offSale(@Param('id', ParseIntPipe) id: number): Promise<null> {
    await this.sellerProductsService.offSale(id);
    return null;
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除（软删）' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<null> {
    await this.sellerProductsService.remove(id);
    return null;
  }
}