import { AnnotationType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAnnotationDto {
  @IsEnum(AnnotationType)
  type!: AnnotationType;

  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;

  @IsOptional()
  @IsString()
  text?: string;
}
