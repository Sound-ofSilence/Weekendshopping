import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateWithdrawalDto {
  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  bankName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  bankAccount!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  accountHolder!: string;
}