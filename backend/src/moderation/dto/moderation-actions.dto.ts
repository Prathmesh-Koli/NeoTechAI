import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ApproveDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}

export class ReturnForRevisionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;
}

export class RequestRecheckDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;

  // Optional: which evaluator should re-evaluate the script. When omitted the
  // service picks another active evaluator in the same tenant.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  evaluatorId?: string;
}
