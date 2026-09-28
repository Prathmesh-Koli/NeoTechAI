import { IsBoolean } from 'class-validator';

export class SetPageBlankDto {
  @IsBoolean()
  isBlank!: boolean;
}
