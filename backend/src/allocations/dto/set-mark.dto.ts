import { AttemptStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class SetMarkDto {
  @IsEnum(AttemptStatus)
  attemptStatus!: AttemptStatus;

  @IsOptional()
  @IsNumber()
  marksAwarded?: number | null;
}
