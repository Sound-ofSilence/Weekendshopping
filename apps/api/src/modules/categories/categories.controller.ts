import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CategoriesService } from './categories.service';
import { CategoryNodeDto } from './dto/category-response.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get('tree')
  @ApiOperation({ summary: '完整类目树' })
  tree(): Promise<CategoryNodeDto[]> {
    return this.categoriesService.tree();
  }

  @Public()
  @Get(':id/children')
  @ApiOperation({ summary: '某类目的子类目' })
  children(@Param('id', ParseIntPipe) id: number): Promise<CategoryNodeDto[]> {
    return this.categoriesService.children(id);
  }
}