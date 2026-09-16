import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AddressesService } from './addresses.service';
import { AddressResponseDto, toAddressResponse } from './dto/address-response.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiTags('addresses')
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: '地址列表' })
  async list(@CurrentUser() user: AuthUser): Promise<AddressResponseDto[]> {
    const addresses = await this.addressesService.list(Number(user.userId));
    return addresses.map(toAddressResponse);
  }

  @Post()
  @ApiOperation({ summary: '新增地址' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto): Promise<AddressResponseDto> {
    const address = await this.addressesService.create(Number(user.userId), dto);
    return toAddressResponse(address);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新地址' })
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    const address = await this.addressesService.update(Number(user.userId), id, dto);
    return toAddressResponse(address);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除地址' })
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number): Promise<null> {
    await this.addressesService.remove(Number(user.userId), id);
    return null;
  }

  @Patch(':id/default')
  @ApiOperation({ summary: '设为默认地址' })
  async setDefault(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number): Promise<AddressResponseDto> {
    const address = await this.addressesService.setDefault(Number(user.userId), id);
    return toAddressResponse(address);
  }
}
