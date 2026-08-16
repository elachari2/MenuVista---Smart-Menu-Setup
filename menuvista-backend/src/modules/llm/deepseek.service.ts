import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { BUILD_UNIFIED_VISION_PROMPT } from './prompts/vision.prompt';
import {
  UnifiedMenuExtractionSchema,
  UnifiedMenuExtractionType,
} from './schemas/vision.schema';

/**
 * Service LLM alimenté par l'API DeepSeek (compatible OpenAI)
 * pour la structuration et l'enrichissement gastronomique des menus.
 */
@Injectable()
export class DeepSeekService {
  private readonly logger = new Logger(DeepSeekService.name);
  private readonly client: OpenAI;
  private readonly modelName: string;

  constructor(private readonly configService?: ConfigService) {
    const apiKey =
      process.env.DEEPSEEK_API_KEY ||
      (configService ? configService.get<string>('DEEPSEEK_API_KEY') : undefined) ||
      'sk-7e7344e407d6439bb44806239fe22bca';

    const baseURL =
      process.env.DEEPSEEK_BASE_URL ||
      (configService ? configService.get<string>('DEEPSEEK_BASE_URL') : undefined) ||
      'https://api.deepseek.com/v1';

    this.modelName =
      process.env.DEEPSEEK_MODEL ||
      (configService ? configService.get<string>('DEEPSEEK_MODEL') : undefined) ||
      'deepseek-chat';

    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });

    this.logger.log(`[DeepSeek] Service initialisé avec le modèle ${this.modelName} (BaseURL: ${baseURL})`);
  }

  /**
   * Génère du texte avec DeepSeek (compatible OpenAI)
   */
  async generateText(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      this.logger.log('[DeepSeek] Génération de texte en cours...');

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: messages,
        temperature: 0.2,
        max_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content || '';
      this.logger.log(`[DeepSeek] ✅ Texte généré (${content.length} caractères)`);
      return content;
    } catch (error: any) {
      this.logger.error(`[DeepSeek] ❌ Erreur API: ${error?.message || error}`);
      throw error;
    }
  }

  /**
   * Génère une réponse JSON structurée avec DeepSeek et validation Zod
   */
  async generateStructuredResponse<T>(
    prompt: string,
    schema: any,
    systemPrompt?: string,
  ): Promise<T | null> {
    try {
      this.logger.log('[DeepSeek] Génération JSON structurée en cours...');

      const jsonPrompt = `${prompt}\n\nRéponds UNIQUEMENT en JSON valide, sans balises ni texte avant/après.`;

      const rawText = await this.generateText(jsonPrompt, systemPrompt);

      if (!rawText || rawText.trim().length === 0) {
        this.logger.warn('[DeepSeek] Réponse vide reçue');
        return null;
      }

      const cleanJsonText = this.cleanJsonResponse(rawText);
      const parsed = JSON.parse(cleanJsonText);
      return schema.parse(parsed) as T;
    } catch (error: any) {
      this.logger.error(`[DeepSeek] ❌ Erreur JSON/Zod: ${error?.message || error}`);
      return null;
    }
  }

  /**
   * Structuration d'un menu complet à partir du texte OCR
   */
  async extractStructuredMenu(
    ocrText: string,
    _filePath?: string,
  ): Promise<UnifiedMenuExtractionType> {
    this.logger.log('[DeepSeek] Structuration du menu OCR en cours...');

    const prompt = BUILD_UNIFIED_VISION_PROMPT(ocrText);
    const systemPrompt = 'Tu es un expert mondial en structuration de menus de restaurant. Réponds UNIQUEMENT sous forme de JSON valide.';

    const result = await this.generateStructuredResponse<UnifiedMenuExtractionType>(
      prompt,
      UnifiedMenuExtractionSchema,
      systemPrompt,
    );

    if (!result) {
      throw new Error('DEEPSEEK_EXTRACTION_ERROR: Impossible de structurer le menu avec l\'API DeepSeek');
    }

    this.logger.log(`[DeepSeek] Structuration réussie. Catégories: ${result.categories.length}`);
    return result;
  }

  /**
   * Nettoie les balises markdown JSON de la réponse
   */
  private cleanJsonResponse(rawText: string): string {
    let text = rawText.trim();
    if (text.startsWith('```json')) {
      text = text.substring(7);
    } else if (text.startsWith('```')) {
      text = text.substring(3);
    }
    if (text.endsWith('```')) {
      text = text.substring(0, text.length - 3);
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    return text.trim();
  }
}
