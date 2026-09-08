import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class ScheduleExceptionsQueryDto {
  @ApiPropertyOptional({ example: '2026-09-08' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be YYYY-MM-DD' })
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-07' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be YYYY-MM-DD' })
  to?: string;
}
