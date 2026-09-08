export interface AppConfig {
  env: string;
  port: number;
  isProduction: boolean;
}

export interface MongoConfig {
  uri: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface BookingConfig {
  /** Slots starting sooner than this are not offered. */
  leadTimeMinutes: number;
  /** Furthest calendar date (from today in clinic TZ) availability may be requested for. */
  availabilityHorizonDays: number;
}

export interface Configuration {
  app: AppConfig;
  mongodb: MongoConfig;
  jwt: JwtConfig;
  booking: BookingConfig;
}

export default (): Configuration => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    isProduction: process.env.NODE_ENV === 'production',
  },
  mongodb: {
    uri: process.env.MONGODB_URI as string,
  },
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  booking: {
    leadTimeMinutes: parseInt(process.env.BOOKING_LEAD_TIME_MINUTES ?? '15', 10),
    availabilityHorizonDays: parseInt(process.env.AVAILABILITY_HORIZON_DAYS ?? '90', 10),
  },
});
