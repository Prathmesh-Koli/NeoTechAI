import { AttemptStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class MarkChangeDto {
  @IsString()
  @IsNotEmpty()
  rubricStepId!: string;

  @IsEnum(AttemptStatus)
  attemptStatus!: AttemptStatus;

  // Required (and range-checked in the service) when attemptStatus is
  // ATTEMPTED; must be null/omitted otherwise.
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  marksAwarded?: number | null;
}

export class AdjustMarksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => MarkChangeDto)
  marks!: MarkChangeDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}
