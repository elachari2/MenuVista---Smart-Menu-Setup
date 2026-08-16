import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/logger.util';

/**
 * Fonction de démarrage principale d'initialisation du serveur NestJS.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(AppLogger);
  app.useLogger(logger);

  // Servir les images du dataset local et les fallbacks
  app.useStaticAssets(join(process.cwd(), 'data', 'images'), {
    prefix: '/images/dataset/',
  });

  app.useStaticAssets(join(process.cwd(), 'data', 'fallback'), {
    prefix: '/images/fallback/',
  });

  // Configuration du préfixe d'API global (/api/v1)
  app.setGlobalPrefix('api/v1');

  // Activation de la validation globale des DTO via ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Activation du CORS pour autoriser l'accès depuis l'application frontend
  app.enableCors();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
  logger.log(
    `🚀 MenuVista Backend Démarré sur le port ${port} [API: http://localhost:${port}/api/v1]`,
    'Bootstrap',
  );
}

bootstrap().catch((err: unknown) => {
  console.error('Erreur critique lors du démarrage de MenuVista Backend:', err);
  process.exit(1);
});
