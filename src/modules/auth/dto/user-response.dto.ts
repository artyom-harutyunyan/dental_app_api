import { ApiProperty } from '@nestjs/swagger';

import { UserRole } from '../../../common/enums/user-role.enum';

export class UserResponseDto {
  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0d' })
  id!: string;

  @ApiProperty({ example: 'Anna Petrosyan' })
  name!: string;

  @ApiProperty({ example: 'anna@example.com' })
  email!: string;

  @ApiProperty({ example: '+37499111222', nullable: true })
  phone!: string | null;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole', example: UserRole.PATIENT })
  role!: UserRole;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Set for staff accounts; null for patients.',
  })
  clinicId!: string | null;
}
