import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateClinicDto {
  @ApiPropertyOptional({ example: 'Yerevan Dental Clinic' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'Asia/Yerevan' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 15, minimum: 1, maximum: 480 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(480)
  consultationDurationMinutes?: number;

  @ApiPropertyOptional({ example: 90, minimum: 1, maximum: 480 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(480)
  treatmentDurationMinutes?: number;

  @ApiPropertyOptional({ example: 60, minimum: 1, maximum: 480 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(480)
  minTreatmentDurationMinutes?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  bufferMinutes?: number;
}
