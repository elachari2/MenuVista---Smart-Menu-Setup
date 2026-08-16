import { Injectable } from '@nestjs/common';
import { createWorker, PSM } from 'tesseract.js';
import { AppLogger } from '../../common/logger/logger.util';

/**
 * Service de reconnaissance optique de caractères (OCR) trilingue (français, arabe, anglais).
 * Utilise Tesseract.js avec détection automatique de la mise en page (PSM AUTO).
 */
@Injectable()
export class OcrService {
  constructor(private readonly logger: AppLogger) {}

  /**
   * Analyse une image prétraitée et extrait le texte brut trilingue.
   * @param imagePath Chemin d'accès à l'image à analyser
   * @returns Texte brut extrait de l'image
   */
  async extractText(imagePath: string): Promise<string> {
    const context = 'OcrService';
    this.logger.log(
      `Lancement de l'OCR Tesseract.js trilingue (fra+ara+eng) pour: ${imagePath}`,
      context,
    );

    let worker;
    try {
      // Initialisation du worker Tesseract.js pour le français, l'arabe et l'anglais
      worker = await createWorker(['fra', 'ara', 'eng']);

      // Configuration du mode de segmentation de page (PSM AUTO = 3) pour la lecture de colonnes de menus
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
      });

      // Exécution de la reconnaissance optique de caractères
      const result = await worker.recognize(imagePath);
      const extractedText = result.data.text ? result.data.text.trim() : '';

      this.logger.log(
        `OCR terminé avec succès. Caractères extraits: ${extractedText.length}`,
        context,
      );

      return extractedText;
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Erreur lors de l'extraction OCR Tesseract pour l'image ${imagePath}: ${errMessage}`,
        error instanceof Error ? error.stack : undefined,
        context,
      );
      throw new Error(`Échec de l'extraction OCR: ${errMessage}`);
    } finally {
      if (worker) {
        try {
          await worker.terminate();
          this.logger.debug(`Worker Tesseract libéré avec succès.`, context);
        } catch (cleanupErr: unknown) {
          this.logger.warn(`Erreur lors de la fermeture du worker Tesseract: ${cleanupErr}`, context);
        }
      }
    }
  }
}
