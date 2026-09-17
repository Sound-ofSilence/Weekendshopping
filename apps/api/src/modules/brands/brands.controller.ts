import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { BrandsService } from './brands.service';
import { BrandQueryDto } from './dto/brand-query.dto';
import { BrandResponseDto } from './dto/brand-response.dto';

@ApiTags('brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '品牌列表（分页）' })
  list(@Query() query: BrandQueryDto): Promise<PaginatedResponseDto<BrandResponseDto>> {
    return this.brandsService.list(query);
  }
}