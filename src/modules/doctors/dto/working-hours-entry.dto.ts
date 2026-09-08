import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class WorkingHoursEntryDto {
  @ApiProperty({ example: 1, minimum: 0, maximum: 6, description: '0 = Sunday … 6 = Saturday' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiProperty({ example: false })
  @IsBoolean()
  isDayOff!: boolean;

  @ApiPropertyOptional({ example: 540, nullable: true, description: 'Minutes from local midnight' })
  @ValidateIf((entry: WorkingHoursEntryDto) => entry.isDayOff === false)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1440)
  startMinute?: number | null;

  @ApiPropertyOptional({ example: 1080, nullable: true, description: 'Minutes from local midnight' })
  @ValidateIf((entry: WorkingHoursEntryDto) => entry.isDayOff === false)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1440)
  endMinute?: number | null;
}
