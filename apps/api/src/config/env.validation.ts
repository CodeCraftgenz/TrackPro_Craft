import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 3001;

  // Database - Required
  @IsString()
  @IsNotEmpty({ message: 'DATABASE_URL is required' })
  DATABASE_URL!: string;

  // JWT - Required with minimum length
  @IsString()
  @IsNotEmpty({ message: 'JWT_SECRET is required' })
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters' })
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '15m';

  // Encryption - Required in production
  @IsString()
  @IsOptional()
  ENCRYPTION_KEY?: string;

  // ClickHouse - Required
  @IsString()
  @IsNotEmpty({ message: 'CLICKHOUSE_HOST is required' })
  CLICKHOUSE_HOST!: string;

  @IsString()
  @IsNotEmpty({ message: 'CLICKHOUSE_DATABASE is required' })
  CLICKHOUSE_DATABASE!: string;

  @IsString()
  @IsOptional()
  CLICKHOUSE_USER?: string;

  @IsString()
  @IsOptional()
  CLICKHOUSE_PASSWORD?: string;

  // Redis - Optional (uses defaults)
  @IsString()
  @IsOptional()
  REDIS_HOST?: string;

  @IsNumber()
  @IsOptional()
  REDIS_PORT?: number;

  // OAuth - Optional but validated if provided
  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  GOOGLE_CLIENT_SECRET?: string;

  @IsString()
  @IsOptional()
  MICROSOFT_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  MICROSOFT_CLIENT_SECRET?: string;

  // CORS - Required
  @IsString()
  @IsNotEmpty({ message: 'CORS_ORIGIN is required' })
  CORS_ORIGIN!: string;

  @IsString()
  @IsNotEmpty({ message: 'FRONTEND_URL is required' })
  FRONTEND_URL!: string;
}

export function validate(config: Record<string, unknown>) {
  const isProduction = config.NODE_ENV === 'production';

  // Transform string numbers to actual numbers
  const transformedConfig = {
    ...config,
    PORT: config.PORT ? parseInt(config.PORT as string, 10) : 3001,
    REDIS_PORT: config.REDIS_PORT
      ? parseInt(config.REDIS_PORT as string, 10)
      : undefined,
  };

  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    transformedConfig,
    {
      enableImplicitConversion: true,
    },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints)
          : ['Invalid value'];
        return `${error.property}: ${constraints.join(', ')}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  // Additional production-specific validations
  if (isProduction) {
    if (!validatedConfig.ENCRYPTION_KEY) {
      throw new Error(
        'ENCRYPTION_KEY is required in production environment',
      );
    }

    if (validatedConfig.ENCRYPTION_KEY.length < 32) {
      throw new Error(
        'ENCRYPTION_KEY must be at least 32 characters in production',
      );
    }

    // Warn about insecure defaults (but don't fail)
    if (validatedConfig.JWT_EXPIRES_IN === '7d') {
      console.warn(
        '[Security Warning] JWT_EXPIRES_IN is set to 7 days. Consider using shorter expiration for access tokens.',
      );
    }
  }

  return validatedConfig;
}