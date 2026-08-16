import { LoggerService, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Service de logging centralisé basé sur Winston.
 * Permet un journalage structuré en console et dans des fichiers de logs.
 */
@Injectable()
export class AppLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    // S'assurer que le dossier des logs existe
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Format personnalisé pour la console et les fichiers
    const customFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, context, stack }) => {
        const ctx = context ? `[${context}] ` : '';
        const stackInfo = stack ? `\n${stack}` : '';
        return `${timestamp} [${level.toUpperCase()}] ${ctx}${message}${stackInfo}`;
      }),
    );

    // Initialisation du logger Winston avec transports Console et Fichiers
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: customFormat,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({ all: true }),
            customFormat,
          ),
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'app.log'),
        }),
      ],
    });
  }

  /**
   * Enregistre un message d'information.
   * @param message Message à journaliser
   * @param context Contexte optionnel du module
   */
  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  /**
   * Enregistre un message d'erreur avec la stack trace facultative.
   * @param message Message d'erreur
   * @param trace Stack trace de l'erreur
   * @param context Contexte optionnel du module
   */
  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { stack: trace, context });
  }

  /**
   * Enregistre un avertissement (warning).
   * @param message Message d'avertissement
   * @param context Contexte optionnel du module
   */
  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  /**
   * Enregistre un message de débogage (debug).
   * @param message Message de debug
   * @param context Contexte optionnel du module
   */
  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  /**
   * Enregistre un message verbeux (verbose).
   * @param message Message verbeux
   * @param context Contexte optionnel du module
   */
  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }
}
