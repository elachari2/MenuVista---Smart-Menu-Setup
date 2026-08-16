import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Génère la configuration TypeORM à partir des variables d'environnement.
 * @param configService Instance du ConfigService NestJS
 * @returns Options de connexion TypeORM pour PostgreSQL
 */
export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USER', 'menuvista'),
  password: configService.get<string>('DB_PASSWORD', 'menuvista123'),
  database: configService.get<string>('DB_NAME', 'menuvista_db'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: configService.get<string>('NODE_ENV') !== 'production', // Migration auto en mode dev
  logging: configService.get<string>('NODE_ENV') === 'development',
});
