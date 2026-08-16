import { Injectable, Logger } from '@nestjs/common';
import { GroqService } from './groq.service';
import { BUILD_UNIFIED_VISION_PROMPT } from './prompts/vision.prompt';
import {
  UnifiedMenuExtractionSchema,
  UnifiedMenuExtractionType,
} from './schemas/vision.schema';

/**
 * Service LLM avec sélection automatique de la tâche et bascule de modèles GROQ
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly groqService: GroqService) {}

  /**
   * Structure un menu OCR - utilise le modèle le plus précis pour la structuration
   */
  async structurerMenu(ocrText: string): Promise<UnifiedMenuExtractionType | null> {
    const prompt = BUILD_UNIFIED_VISION_PROMPT(ocrText);
    const systemPrompt = 'Tu es un expert en structuration de menus. Réponds UNIQUEMENT en JSON.';

    return this.groqService.generateStructuredResponse<UnifiedMenuExtractionType>(
      prompt,
      UnifiedMenuExtractionSchema,
      'structuration',
      systemPrompt,
    );
  }

  /**
   * Enrichit un plat - utilise le modèle équilibré pour l'enrichissement
   */
  async enrichirPlat(plat: any): Promise<any> {
    const prompt = `Enrichis ce plat de restaurant: Nom="${plat.nom}", Catégorie="${plat.categorie || ''}", Ingrédients="${plat.description || ''}". Fournis les allergènes, la description gastronomique et la traduction.`;
    const systemPrompt = 'Tu es un chef cuisinier expert. Réponds UNIQUEMENT en JSON.';

    return this.groqService.generateStructuredResponse(
      prompt,
      null,
      'enrichissement',
      systemPrompt,
    );
  }

  /**
   * Génère une description simple - utilise le modèle le plus rapide (Llama 3.1 8B)
   */
  async genererDescription(nom: string, ingredients?: string): Promise<string> {
    const prompt = `Génère une description appétissante pour ce plat : ${nom}. Ingrédients : ${ingredients || 'Non spécifiés'}.`;

    return this.groqService.generateWithFallback(
      prompt,
      'description',
      'Tu es un chef cuisinier expert.',
    );
  }

  /**
   * Méthodes rétrocompatibles
   */
  async generateContentWithFallback(
    prompt: string,
    systemPrompt?: string,
    _temperature?: number,
    _inlineImage?: any,
  ): Promise<string | null> {
    try {
      return await this.groqService.generateWithFallback(prompt, 'structuration', systemPrompt);
    } catch (error: any) {
      this.logger.error(`[LLM] Erreur GROQ: ${error?.message || error}`);
      return null;
    }
  }

  async generateStructuredResponse<T>(
    prompt: string,
    schema: any,
    systemPrompt?: string,
  ): Promise<T | null> {
    return await this.groqService.generateStructuredResponse<T>(
      prompt,
      schema,
      'structuration',
      systemPrompt,
    );
  }

  async extractStructuredMenu(
    ocrText: string,
    filePath?: string,
  ): Promise<UnifiedMenuExtractionType> {
    return await this.groqService.extractStructuredMenu(ocrText, filePath);
  }
}
