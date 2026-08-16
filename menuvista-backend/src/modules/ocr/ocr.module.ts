import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { ImagePreprocessService } from './image-preprocess.service';
import { AppLogger } from '../../common/logger/logger.util';

/**
 * Module OCR regroupant le prétraitement d'image (Sharp) et l'extraction de texte (Tesseract).
 */
@Module({
  providers: [OcrService, ImagePreprocessService, AppLogger],
  exports: [OcrService, ImagePreprocessService],
})
export class OcrModule {}
