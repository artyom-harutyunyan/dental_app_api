import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateScheduleExceptionDto {
  @ApiProperty({ example: '2026-09-15', description: 'Clinic-local calendar date YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isDayOff!: boolean;

  @ApiPropertyOptional({ example: 540, nullable: true })
  @ValidateIf((dto: CreateScheduleExceptionDto) => dto.isDayOff === false)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1440)
  startMinute?: number | null;

  @ApiPropertyOptional({ example: 780, nullable: true })
  @ValidateIf((dto: CreateScheduleExceptionDto) => dto.isDayOff === false)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1440)
  endMinute?: number | null;

  @ApiPropertyOptional({ example: 'Public holiday', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string | null;
}
