import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import {
  CreateFreightTemplateDto,
  UpdateFreightTemplateDto,
} from './dto/freight-template.dto';
import { FreightService } from './freight.service';

@ApiTags('freight-templates')
@UseGuards(JwtAuthGuard)
@Roles(Role.MERCHANT)
@Controller('seller/freight-templates')
export class FreightController {
  constructor(private readonly freightService: FreightService) {}

  @Get()
  @ApiOperation({ summary: '运费模板列表' })
  list(@CurrentUser() user: AuthUser): Promise<Record<string, unknown>[]> {
    return this.freightService.list(user.userId);
  }

  @Post()
  @ApiOperation({ summary: '创建运费模板' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateFreightTemplateDto,
  ): Promise<Record<string, unknown>> {
    return this.freightService.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新运费模板' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateFreightTemplateDto,
  ): Promise<Record<string, unknown>> {
    return this.freightService.update(user.userId, Number(id), dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除运费模板' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<null> {
    return this.freightService.remove(user.userId, Number(id));
  }
}
