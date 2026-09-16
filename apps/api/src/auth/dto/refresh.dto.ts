import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'refreshToken' })
  @IsNotEmpty({ message: 'refreshToken 不能为空' })
  refreshToken!: string;
}
