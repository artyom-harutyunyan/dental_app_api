import { ApiProperty } from '@nestjs/swagger';

import { UserResponseDto } from './user-response.dto';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token. Send as `Authorization: Bearer <token>`.',
  })
  accessToken!: string;

  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;
}
