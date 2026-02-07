import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';
import {
  createCorsOptions,
  hasValidKey,
  parseAllowedOrigins,
} from 'src/common/utils/cors.utils';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { seedDefaultUser } from './common/utils/seed.utils';
import { IDEMPOTENCY_ID_HEADER } from 'src/common/constants/idempotency.constant';
import { AUTH_HEADER } from 'src/common/constants/auth.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'debug', 'log'],
    rawBody: true,
  });

  // Set up versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // CORS configuration
  const allowedOriginsString = process.env.ALLOWED_ORIGINS || '';

  const allowedOrigins = parseAllowedOrigins(allowedOriginsString);

  // Set up CORS with our utility
  app.enableCors(createCorsOptions(allowedOrigins, hasValidKey));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );

  // Security middleware
  app.use(helmet());
  app.use(compression());

  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle(process.env.APP_NAME || '')
    .setDescription(process.env.APP_DESCRIPTION || '')
    .setVersion(process.env.API_VERSION || '1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: IDEMPOTENCY_ID_HEADER,
        in: 'header',
      },
      IDEMPOTENCY_ID_HEADER,
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: AUTH_HEADER,
        in: 'header',
      },
      AUTH_HEADER,
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    ignoreGlobalPrefix: false,
  });

  try {
    SwaggerModule.setup('docs', app, swaggerDocument, {
      customSiteTitle: process.env.CUSTOM_SITE_TITLE,
      swaggerOptions: { persistAuthorization: true },
      useGlobalPrefix: true,
    });
  } catch (error) {
    Logger.error(`Error setting up Swagger: ${error}`, 'Bootstrap');
  }

  await seedDefaultUser(app);

  const port = process.env.PORT || 5000;

  await app.listen(port);
  const url = await app.getUrl();
  console.log(`Demo Credit Server is running on: ${url}`);
  console.log(`Documentation is available at: ${url}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to bootstrap the application', err);
  process.exit(1);
});
