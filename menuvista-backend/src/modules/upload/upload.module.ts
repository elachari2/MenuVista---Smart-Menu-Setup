import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { MenuUploadJob } from '../menu/entities/menu-upload-job.entity';
import { OcrModule } from '../ocr/ocr.module';
import { LlmModule } from '../llm/llm.module';
import { StructurationModule } from '../structuration/structuration.module';
import { MenuModule } from '../menu/menu.module';
import { EnrichmentModule } from '../enrichment/enrichment.module';
import { ImageMatchingModule } from '../image-matching/image-matching.module';
import { AppLogger } from '../../common/logger/logger.util';

/**
 * Module d'upload orchestrant le prétraitement, l'OCR, la structuration, l'enrichissement, le matching de visuels et la persistance BDD.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([MenuUploadJob]),
    OcrModule,
    LlmModule,
    StructurationModule,
    MenuModule,
    EnrichmentModule,
    ImageMatchingModule,
  ],
  controllers: [UploadController],
  providers: [UploadService, AppLogger],
  exports: [UploadService],
})
export class UploadModule {}
