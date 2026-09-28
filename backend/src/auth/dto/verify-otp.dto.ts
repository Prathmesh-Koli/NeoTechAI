import { IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  mfaToken!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
