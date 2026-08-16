import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { AppLogger } from '../../common/logger/logger.util';

/**
 * Service de prétraitement d'image avec Sharp.
 * Nettoie et améliore l'image avant l'analyse OCR (niveaux de gris, contraste, accentuation).
 */
@Injectable()
export class ImagePreprocessService {
  constructor(private readonly logger: AppLogger) {}

  /**
   * Prétraite une image pour optimiser la reconnaissance OCR par Tesseract.
   * @param inputFilePath Chemin du fichier image original
   * @returns Chemin du fichier image prétraité
   */
  async preprocessImage(inputFilePath: string): Promise<string> {
    const context = 'ImagePreprocessService';
    this.logger.log(`Début du prétraitement Sharp pour l'image: ${inputFilePath}`, context);

    try {
      const parsedPath = path.parse(inputFilePath);
      const outputFilePath = path.join(
        parsedPath.dir,
        `${parsedPath.name}_processed.png`,
      );

      // Application des filtres Sharp : conversion niveaux de gris, normalisation du contraste et accentuation des contours
      await sharp(inputFilePath)
        .grayscale()
        .normalize()
        .sharpen()
        .toFormat('png')
        .toFile(outputFilePath);

      this.logger.log(
        `Prétraitement d'image terminé avec succès -> ${outputFilePath}`,
        context,
      );
      return outputFilePath;
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Erreur lors du prétraitement Sharp de l'image ${inputFilePath}: ${errMessage}`,
        error instanceof Error ? error.stack : undefined,
        context,
      );
      throw new Error(`Échec du prétraitement d'image: ${errMessage}`);
    }
  }

  /**
   * Supprime un fichier temporaire du système de fichiers après traitement.
   * @param filePath Chemin du fichier à supprimer
   */
  async cleanupFile(filePath: string): Promise<void> {
    const context = 'ImagePreprocessService';
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.debug(`Fichier temporaire supprimé: ${filePath}`, context);
      }
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Impossible de supprimer le fichier ${filePath}: ${errMessage}`, context);
    }
  }
}
