import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuUploadJob, JobStatus } from '../menu/entities/menu-upload-job.entity';
import { ImagePreprocessService } from '../ocr/image-preprocess.service';
import { OcrService } from '../ocr/ocr.service';
import { LlmService } from '../llm/llm.service';
import { StructurationService } from '../structuration/structuration.service';
import { MenuService } from '../menu/menu.service';
import { EnrichmentService } from '../enrichment/enrichment.service';
import { ImageMatchingService } from '../image-matching/image-matching.service';
import { ImageMatchingQueueService } from '../image-matching/image-matching.queue.service';
import { AppLogger } from '../../common/logger/logger.util';
import { UploadResponseDto } from './dto/upload-response.dto';
import { JobStatusResponseDto } from './dto/job-status-response.dto';
import { UnifiedMenuExtractionType } from '../llm/schemas/vision.schema';

/**
 * Service orchestrant l'upload, l'OCR, la structuration IA multimodale, l'enrichissement par lots, le matching d'images BullMQ et la persistance BDD.
 */
@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(MenuUploadJob)
    private readonly jobRepository: Repository<MenuUploadJob>,
    private readonly preprocessService: ImagePreprocessService,
    private readonly ocrService: OcrService,
    private readonly llmService: LlmService,
    private readonly structurationService: StructurationService,
    private readonly menuService: MenuService,
    private readonly enrichmentService: EnrichmentService,
    private readonly matchingService: ImageMatchingService,
    private readonly matchingQueueService: ImageMatchingQueueService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Crée un nouveau job de numérisation de menu et déclenche le traitement asynchrone.
   * @param file Fichier image téléversé via Multer
   */
  async createJob(file: Express.Multer.File): Promise<UploadResponseDto> {
    const context = 'UploadService';
    this.logger.log(`Création d'un nouveau job pour le fichier: ${file.originalname}`, context);

    try {
      const job = this.jobRepository.create({
        originalFilename: file.originalname,
        filePath: file.path,
        status: JobStatus.RECU,
      });

      const savedJob = await this.jobRepository.save(job);
      this.logger.log(`Job enregistré avec succès. ID: ${savedJob.id}`, context);

      setImmediate(() => {
        this.processOcrPipeline(savedJob.id, savedJob.filePath).catch((err: unknown) => {
          const errMessage = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Erreur non capturée dans le pipeline pour le job ${savedJob.id}: ${errMessage}`,
            err instanceof Error ? err.stack : undefined,
            context,
          );
        });
      });

      return {
        jobId: savedJob.id,
        status: savedJob.status,
        message: 'Fichier reçu avec succès. Traitement OCR, structuration, enrichissement IA et matching d\'images en cours.',
        createdAt: savedJob.createdAt,
      };
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Erreur lors de la création du job d'upload: ${errMessage}`,
        error instanceof Error ? error.stack : undefined,
        context,
      );
      throw error;
    }
  }

  /**
   * Exécute le pipeline complet : Sharp ➔ OCR Tesseract ➔ GROQ Vision ➔ Persistance BDD ➔ Enrichissement IA ➔ Matching d'Images BullMQ.
   * @param jobId Identifiant unique du job
   * @param filePath Chemin d'accès au fichier image d'origine
   */
  private async processOcrPipeline(jobId: string, filePath: string): Promise<void> {
    const context = 'UploadService:Pipeline';
    this.logger.log(`Début du traitement complet pour le job: ${jobId}`, context);

    let processedPath: string | null = null;

    try {
      // 1. Statut 'ocr_en_cours'
      await this.jobRepository.update(jobId, { status: JobStatus.OCR_EN_COURS });

      // 2. Prétraitement de l'image avec Sharp
      processedPath = await this.preprocessService.preprocessImage(filePath);

      // 3. Extraction du texte OCR de référence avec Tesseract.js
      const rawText = await this.ocrService.extractText(processedPath);

      // 4. Structuration multimodale IA (GROQ Vision / Fallback)
      let structuredData: UnifiedMenuExtractionType;
      try {
        this.logger.log(`Tentative de structuration multimodale via GROQ Llama 3.3 70B...`, context);
        structuredData = await this.llmService.extractStructuredMenu(rawText, filePath);

        // Si GROQ retourne le fallback fictif ("Plat du Chef") faute de clé API GROQ valide,
        // basculer sur le parser OCR local pour extraire les plats réels du menu.
        const isGenericFallback =
          structuredData?.categories?.length === 1 &&
          (structuredData.categories[0].nom === 'Plats Principaux' || structuredData.categories[0].nom === 'Menu Principal') &&
          structuredData.categories[0].plats?.[0]?.nom === 'Plat du Chef';

        if (isGenericFallback) {
          this.logger.warn(
            `Détection du fallback générique GROQ (Absence de clé API valide). Basculement automatique vers le parser OCR local pour extraire les vrais plats.`,
            context,
          );
          structuredData = this.structurationService.parseOcrText(rawText);
        }
      } catch (llmErr: unknown) {
        const llmErrMsg = llmErr instanceof Error ? llmErr.message : String(llmErr);
        this.logger.warn(
          `Échec de la structuration LLM GROQ (${llmErrMsg}). Basculement vers le parser local.`,
          context,
        );
        structuredData = this.structurationService.parseOcrText(rawText);
      }

      // 5. Persistance initiale en BDD (Transaction PostgreSQL + Déduplication)
      const createdMenu = await this.menuService.persistMenuFromStructuredData(jobId, structuredData);

      // 6. ENRICHISSEMENT IA PAR LOTS (Descriptions, 14 allergènes, tags, traductions)
      try {
        this.logger.log(`Déclenchement de l'enrichissement IA pour le menu ${createdMenu.id}...`, context);
        const dishesToEnrich = await this.menuService.getDishesForEnrichment(createdMenu.id);
        if (dishesToEnrich.length > 0) {
          const enrichmentMap = await this.enrichmentService.enrichDishesInBatches(dishesToEnrich);
          await this.menuService.saveEnrichedDishes(enrichmentMap);
        }
      } catch (enrichErr: unknown) {
        const enrichErrMsg = enrichErr instanceof Error ? enrichErr.message : String(enrichErr);
        this.logger.warn(
          `Avertissement lors de l'enrichissement IA (${enrichErrMsg}). Le menu structuré reste accessible.`,
          context,
        );
      }

      // 7. SPRINT 4 — ASSOCIATION IMMEDIATE & SYNCHRONE DES VISUELS DE PLATS (Dataset Local)
      try {
        this.logger.log(`Association synchrone des visuels locaux pour le menu ${createdMenu.id}...`, context);
        const dishesForMatching = await this.menuService.getDishesForEnrichment(createdMenu.id);
        if (dishesForMatching.length > 0) {
          for (const dish of dishesForMatching) {
            const matchResult = await this.matchingService.matchPlat(dish.nom, dish.categorie);
            if (matchResult && matchResult.imageUrl) {
              await this.menuService.updatePlatImage(dish.platId, matchResult.imageUrl);
            }
          }
        }
      } catch (matchErr: unknown) {
        const matchErrMsg = matchErr instanceof Error ? matchErr.message : String(matchErr);
        this.logger.warn(`Avertissement lors du matching synchrone (${matchErrMsg}).`, context);
      }

      // 8. Finalisation du job
      await this.jobRepository.update(jobId, {
        status: JobStatus.OCR_TERMINE,
        ocrRawText: rawText,
        menuId: createdMenu.id,
        errorMessage: null,
      });

      this.logger.log(
        `Job ${jobId} et Menu ${createdMenu.id} finalisés avec succès (OCR, IA & Matching visuel).`,
        context,
      );
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Échec du traitement du job ${jobId}: ${errMessage}`,
        error instanceof Error ? error.stack : undefined,
        context,
      );

      await this.jobRepository.update(jobId, {
        status: JobStatus.ECHEC,
        errorMessage: errMessage,
      });
    } finally {
      if (processedPath) {
        await this.preprocessService.cleanupFile(processedPath);
      }
    }
  }

  /**
   * Récupère le statut d'un job par son ID avec l'ID du menu créé.
   * @param jobId Identifiant UUID v4 du job
   */
  async getJobById(jobId: string): Promise<JobStatusResponseDto> {
    const context = 'UploadService';
    const job = await this.jobRepository.findOne({ where: { id: jobId } });

    if (!job) {
      this.logger.warn(`Job introuvable pour l'ID: ${jobId}`, context);
      throw new NotFoundException(`Aucun job trouvé avec l'identifiant ${jobId}`);
    }

    return {
      jobId: job.id,
      originalFilename: job.originalFilename,
      status: job.status,
      ocrRawText: job.ocrRawText,
      menuId: job.menuId,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
