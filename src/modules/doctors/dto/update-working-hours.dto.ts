import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ValidateNested } from 'class-validator';

import { WorkingHoursEntryDto } from './working-hours-entry.dto';

export class UpdateWorkingHoursDto {
  @ApiProperty({ type: [WorkingHoursEntryDto] })
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursEntryDto)
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  weekly!: WorkingHoursEntryDto[];
}
