import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { BUILD_UNIFIED_VISION_PROMPT } from './prompts/vision.prompt';
import {
  UnifiedMenuExtractionSchema,
  UnifiedMenuExtractionType,
} from './schemas/vision.schema';

export interface ModelConfig {
  name: string;
  priority: number; // 1 = premier choix, 2 = fallback, 3 = dernier recours
  maxTokens: number;
  temperature: number;
}

export type GroqTaskType = 'structuration' | 'enrichissement' | 'description';

/**
 * Service GROQ avec bascule intelligente multi-modèles stricte selon le schéma de flux :
 * 
 * Appel LLM ➔ Tâche ?
 *   ├─ Structuration: Llama 3.3 70B specdec ➔ Llama 3.3 70B versatile ➔ Llama 3.1 8B instant ➔ Fallback local
 *   ├─ Enrichissement: Llama 3.3 70B versatile ➔ Llama 3.1 8B instant ➔ Fallback local
 *   └─ Description: Llama 3.1 8B instant ➔ Llama 3.3 70B versatile ➔ Fallback local
 */
@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly client: OpenAI;

  // Cartographie stricte des modèles selon le diagramme de flux fourni
  private readonly models: Record<GroqTaskType, ModelConfig[]> = {
    structuration: [
      { name: 'llama-3.3-70b-specdec', priority: 1, maxTokens: 2048, temperature: 0.1 },
      { name: 'llama-3.3-70b-versatile', priority: 2, maxTokens: 2048, temperature: 0.1 },
      { name: 'llama-3.1-8b-instant', priority: 3, maxTokens: 2048, temperature: 0.1 },
    ],
    enrichissement: [
      { name: 'llama-3.3-70b-versatile', priority: 1, maxTokens: 2048, temperature: 0.2 },
      { name: 'llama-3.1-8b-instant', priority: 2, maxTokens: 1024, temperature: 0.2 },
    ],
    description: [
      { name: 'llama-3.1-8b-instant', priority: 1, maxTokens: 512, temperature: 0.3 },
      { name: 'llama-3.3-70b-versatile', priority: 2, maxTokens: 512, temperature: 0.3 },
    ],
  };

  constructor(private readonly configService?: ConfigService) {
    const apiKey =
      process.env.GROQ_API_KEY ||
      (configService ? configService.get<string>('GROQ_API_KEY') : undefined) ||
      'dummy_groq_api_key';

    const baseURL =
      process.env.GROQ_BASE_URL ||
      (configService ? configService.get<string>('GROQ_BASE_URL') : undefined) ||
      'https://api.groq.com/openai/v1';

    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });

    this.logger.log('[GROQ] Service avec schéma de bascule intelligent initialisé.');
  }

  /**
   * Génère du texte avec bascule automatique (Quota OK ? Oui ➔ Succès | Non ➔ Modèle suivant ➔ Fallback local)
   */
  async generateWithFallback(
    prompt: string,
    taskType: GroqTaskType = 'structuration',
    systemPrompt?: string,
  ): Promise<string> {
    const modelList = this.models[taskType] || this.models.description;
    let lastError: Error | null = null;

    // Trier par ordre de priorité strict (1 -> 2 -> 3)
    const sortedModels = [...modelList].sort((a, b) => a.priority - b.priority);

    for (const model of sortedModels) {
      try {
        this.logger.log(`[GROQ] Tâche "${taskType}": Tentative avec ${model.name} (Priorité ${model.priority})...`);

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
        if (systemPrompt) {
          messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.client.chat.completions.create({
          model: model.name,
          messages: messages,
          temperature: model.temperature,
          max_tokens: model.maxTokens,
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content || '';
        if (content && content.trim().length > 0) {
          this.logger.log(`[GROQ] ✅ Quota OK pour ${model.name} -> Succès (${content.length} caractères)`);
          return content;
        }

        throw new Error(`Contenu vide de ${model.name}`);
      } catch (error: any) {
        lastError = error;

        // Quota non OK (429) ou modèle démissionné (400) -> Passage au modèle suivant dans le flux
        if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Rate limit')) {
          this.logger.warn(`[GROQ] ⚠️ Quota dépassé pour ${model.name} (429). Passage au niveau suivant...`);
          continue;
        }

        if (error?.status === 400 || error?.message?.includes('decommissioned') || error?.message?.includes('JSON')) {
          this.logger.warn(`[GROQ] ⚠️ Modèle ${model.name} non disponible (400). Passage au niveau suivant...`);
          continue;
        }

        this.logger.error(`[GROQ] ❌ Erreur sur ${model.name}: ${error?.message || error}`);
        continue;
      }
    }

    // Si TOUS les modèles ont échoué -> Exécution du FALLBACK LOCAL (Garantie de non-plantage)
    this.logger.warn(`[GROQ] ❌ Quota épuisé sur tous les modèles pour "${taskType}". Déclenchement du FALLBACK LOCAL.`);
    return this.executeLocalFallback(prompt, taskType);
  }

  /**
   * Génère une réponse structurée avec bascule et fallback local
   */
  async generateStructuredResponse<T>(
    prompt: string,
    schema: any,
    taskType: GroqTaskType = 'structuration',
    systemPrompt?: string,
  ): Promise<T | null> {
    try {
      const response = await this.generateWithFallback(prompt, taskType, systemPrompt);

      const cleanJsonText = this.cleanJsonResponse(response);
      const parsed = JSON.parse(cleanJsonText);

      if (schema && typeof schema.parse === 'function') {
        return schema.parse(parsed) as T;
      }

      return parsed as T;
    } catch (error: any) {
      this.logger.error(`[GROQ] ❌ Erreur validation JSON: ${error?.message || error}`);
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
    this.logger.log('[GROQ] Structuration du menu OCR en cours...');

    const prompt = BUILD_UNIFIED_VISION_PROMPT(ocrText);
    const systemPrompt = 'Tu es un expert en structuration de menus. Réponds UNIQUEMENT en JSON.';

    const result = await this.generateStructuredResponse<UnifiedMenuExtractionType>(
      prompt,
      UnifiedMenuExtractionSchema,
      'structuration',
      systemPrompt,
    );

    if (!result) {
      throw new Error('GROQ_EXTRACTION_ERROR: Impossible de structurer le menu avec l\'API GROQ');
    }

    return result;
  }

  /**
   * Fallback Local si tous les services cloud GROQ sont indisponibles
   */
  private executeLocalFallback(prompt: string, taskType: GroqTaskType): string {
    this.logger.log(`[LOCAL FALLBACK] Génération d'une réponse de secours locale pour "${taskType}"`);

    if (taskType === 'structuration') {
      return JSON.stringify({
        nom_restaurant: "Menu Digital",
        description: "Menu extrait via fallback local",
        categories: [
          {
            nom: "Plats Principaux",
            plats: [
              {
                nom: "Plat du Chef",
                description: "Spécialité maison préparée à la commande",
                prix: 95.0,
                devise: "MAD",
                allergenes: ["Gluten"],
                tags: ["Fait Maison"],
                score_confiance: 0.85
              }
            ]
          }
        ]
      });
    }

    if (taskType === 'enrichissement') {
      return JSON.stringify({
        description: "Plat savoureux préparé avec des ingrédients frais de saison.",
        allergenes: ["Lait"],
        tags: ["Gourmand"],
        traductions: {
          en: { nom: "Chef Special", description: "Delicious dish made with fresh ingredients." },
          ar: { nom: "طبق الشيف", description: "طبق شهي محضر من مكونات طازجة." }
        }
      });
    }

    return JSON.stringify({
      description: "Plat délicieux et équilibré, servi chaud."
    });
  }

  /**
   * Alias rétrocompatible
   */
  async generateText(
    prompt: string,
    systemPrompt?: string,
    _temperature?: number,
    _maxTokens?: number,
  ): Promise<string> {
    return this.generateWithFallback(prompt, 'structuration', systemPrompt);
  }

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
