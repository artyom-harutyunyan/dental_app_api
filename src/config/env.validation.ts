import { Type, plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

// Every property needs an explicit type annotation. Without one, `emitDecoratorMetadata`
// records `Object` as the design type and class-transformer's implicit conversion is a no-op,
// so `PORT=3000` from the environment stays a string and fails @IsInt.
export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  @Matches(/^mongodb(\+srv)?:\/\/.+/, {
    message: 'MONGODB_URI must be a mongodb:// or mongodb+srv:// connection string',
  })
  MONGODB_URI!: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string = '7d';
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((error) => `  - ${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`)
      .join('\n');

    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return validated;
}
