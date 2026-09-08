import { ApiProperty } from '@nestjs/swagger';

export class DoctorResponseDto {
  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0d' })
  id!: string;

  @ApiProperty({ example: 'Dr. Ani Hakobyan' })
  name!: string;
}
