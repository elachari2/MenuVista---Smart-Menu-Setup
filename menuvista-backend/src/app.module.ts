import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AppLogger } from './common/logger/logger.util';
import { Restaurant } from './modules/menu/entities/restaurant.entity';
import { Menu } from './modules/menu/entities/menu.entity';
import { Categorie } from './modules/menu/entities/categorie.entity';
import { Plat } from './modules/menu/entities/plat.entity';
import { MenuUploadJob } from './modules/menu/entities/menu-upload-job.entity';
import { UploadModule } from './modules/upload/upload.module';
import { MenuModule } from './modules/menu/menu.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { LlmModule } from './modules/llm/llm.module';
import { StructurationModule } from './modules/structuration/structuration.module';
import { EnrichmentModule } from './modules/enrichment/enrichment.module';
import { DatasetModule } from './modules/dataset/dataset.module';
import { ImageMatchingModule } from './modules/image-matching/image-matching.module';
import { AdminModule } from './modules/admin/admin.module';
import { QueueModule } from './modules/queue/queue.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT') || configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DB_USER') || configService.get<string>('DATABASE_USER', 'menuvista'),
        password: configService.get<string>('DB_PASSWORD') || configService.get<string>('DATABASE_PASSWORD', 'menuvista123'),
        database: configService.get<string>('DB_NAME') || configService.get<string>('DATABASE_NAME', 'menuvista_db'),
        entities: [Restaurant, Menu, Categorie, Plat, MenuUploadJob],
        synchronize: true,
        logging: false,
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    UploadModule,
    MenuModule,
    OcrModule,
    LlmModule,
    StructurationModule,
    EnrichmentModule,
    DatasetModule,
    ImageMatchingModule,
    AdminModule,
    QueueModule,
    NutritionModule,
  ],
  providers: [AppLogger],
})
export class AppModule {}
