import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class NotificationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBooleanString()
  isRead?: string;
}