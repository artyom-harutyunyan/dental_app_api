import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Anna Petrosyan', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'anna@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+37499111222' })
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'phone must be a valid phone number',
  })
  phone!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
