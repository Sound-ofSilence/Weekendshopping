import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateAfterSaleDto {
  @IsInt()
  orderItemId!: number;

  @IsIn([1, 2])
  type!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9)
  evidenceJson?: string[];

  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;
}
