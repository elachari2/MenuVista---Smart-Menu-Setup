import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { UploadService } from './upload.service';
import { UploadResponseDto } from './dto/upload-response.dto';
import { JobStatusResponseDto } from './dto/job-status-response.dto';
import { AppLogger } from '../../common/logger/logger.util';

/** Dossier de stockage temporaire des images téléversées */
const UPLOAD_DEST = process.env.UPLOAD_DIR || './uploads';

/**
 * Configuration de Multer pour le stockage local et le filtrage des fichiers.
 */
const multerOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(UPLOAD_DEST)) {
        fs.mkdirSync(UPLOAD_DEST, { recursive: true });
      }
      cb(null, UPLOAD_DEST);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const filename = `${uuidv4()}${extension}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite stricte de 5 Mo
  },
  fileFilter: (
    req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException(
          'Type de fichier non supporté. Seuls les formats JPG et PNG sont acceptés.',
        ),
        false,
      );
    }
  },
};

/**
 * Contrôleur gérant les requêtes d'upload de photos de menu et le suivi des jobs d'OCR.
 */
@Controller('menus')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Endpoint POST /api/v1/menus/upload
   * Téléverse une photo de menu, génère un jobId et lance le traitement OCR.
   * @param file Fichier image téléversé par le client
   * @returns JobId et statut initial du traitement
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async uploadMenuFile(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    const context = 'UploadController';
    this.logger.log('Requête d\'upload reçue sur POST /api/v1/menus/upload', context);

    if (!file) {
      this.logger.warn('Aucun fichier fourni dans la requête d\'upload', context);
      throw new BadRequestException(
        'Veuillez fournir un fichier image de menu valide (champ "file", max 5 Mo, JPG/PNG).',
      );
    }

    return this.uploadService.createJob(file);
  }

  /**
   * Endpoint GET /api/v1/menus/jobs/:jobId
   * Récupère le statut et le résultat d'un job de numérisation OCR.
   * @param jobId Identifiant unique du job (UUID v4)
   * @returns Statut du job et texte OCR extrait
   */
  @Get('jobs/:jobId')
  async getJobStatus(
    @Param('jobId', new ParseUUIDPipe({ version: '4' })) jobId: string,
  ): Promise<JobStatusResponseDto> {
    const context = 'UploadController';
    this.logger.log(`Consultation du statut du job: ${jobId}`, context);
    return this.uploadService.getJobById(jobId);
  }
}
