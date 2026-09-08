import 'reflect-metadata';

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module';
import { BEARER_AUTH_NAME } from './common/constants/swagger.constants';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

export const API_PREFIX = 'api/v1';
export const SWAGGER_PATH = 'api/docs';
export const DEV_UI_PATH = 'dev-ui';

function mountDevUi(app: NestExpressApplication, logger: Logger): void {
  const root = join(__dirname, '..', 'dev-ui', 'dist');
  const indexHtml = join(root, 'index.html');

  if (!existsSync(indexHtml)) {
    logger.warn(
      `Dev UI not built — run "npm run build:dev-ui" to enable /${DEV_UI_PATH}`,
    );
    return;
  }

  app.use(`/${DEV_UI_PATH}`, express.static(root, { index: false }));
  app.use(`/${DEV_UI_PATH}`, (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    res.sendFile(indexHtml, (error) => {
      if (error) next(error);
    });
  });
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Runs before the Swagger document is built so documented paths include the prefix.
  app.setGlobalPrefix(API_PREFIX);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors();
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Dental Clinic Planner API')
    .setDescription('Booking API for a single-clinic dental practice')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      BEARER_AUTH_NAME,
    )
    .addTag('auth')
    .addTag('clinic')
    .addTag('doctors')
    .addTag('availability')
    .addTag('appointments')
    .addTag('health')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  mountDevUi(app, logger);

  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>('app.port');

  await app.listen(port);

  logger.log(`API listening on http://localhost:${port}/${API_PREFIX}`);
  logger.log(`Swagger UI on http://localhost:${port}/${SWAGGER_PATH}`);
  logger.log(`Dev UI on http://localhost:${port}/${DEV_UI_PATH}`);
}

bootstrap().catch((error: unknown) => {
  // Config validation and MongoDB connection failures land here. Fail loudly
  // rather than leaving a half-started process behind.
  new Logger('Bootstrap').error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
