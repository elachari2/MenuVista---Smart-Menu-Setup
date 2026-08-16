import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import {
  BUILD_BATCH_ENRICHMENT_PROMPT,
  InputDishForEnrichment,
} from './prompts/description.prompt';
import {
  MenuEnrichmentBatchSchema,
  MenuEnrichmentBatchType,
  DishEnrichmentItemType,
} from './schemas/enrichment.schema';
import { SanitizerUtil } from '../../common/utils/sanitizer.util';

/**
 * Service gérant l'enrichissement culinaire IA par lots (Batching 5 plats max)
 * avec utilisation du service LlmService à fallback automatique et cache anti-doublons.
 */
@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  /**
   * Cache en mémoire anti-doublons (Nom du plat normalisé -> Plat enrichi)
   */
  private readonly cacheMap = new Map<string, DishEnrichmentItemType>();

  constructor(private readonly llmService: LlmService) {}

  /**
   * Enrichit un plat individuel avec fallback local automatique.
   */
  async enrichirPlat(plat: { id?: string; nom: string; categorie?: string; description?: string }): Promise<DishEnrichmentItemType> {
    try {
      const inputDish: InputDishForEnrichment = {
        platId: plat.id || '1',
        nom: plat.nom,
        categorie: plat.categorie || '',
        descriptionExistante: plat.description || '',
      };

      const prompt = BUILD_BATCH_ENRICHMENT_PROMPT([inputDish]);
      const systemPrompt = 'Tu es un chef cuisinier expert en rédaction de menus gastronomiques. Réponds UNIQUEMENT en JSON.';

      const result = await this.llmService.generateStructuredResponse<MenuEnrichmentBatchType>(
        prompt,
        MenuEnrichmentBatchSchema,
        systemPrompt,
      );

      if (!result || !result.plats || result.plats.length === 0) {
        this.logger.warn(`[Enrichment] Fallback local activé pour ${plat.nom}`);
        return this.getFallbackEnrichment(plat.nom);
      }

      this.logger.log(`[Enrichment] ✅ Succès pour ${plat.nom}`);
      return result.plats[0];
    } catch (error: any) {
      this.logger.error(`[Enrichment] Erreur pour ${plat.nom}: ${error?.message || error}`);
      return this.getFallbackEnrichment(plat.nom);
    }
  }

  /**
   * Enrichit un ensemble de plats par lots de 5 plats maximum.
   * @param dishes Liste des plats bruts à enrichir
   * @returns Map des plats enrichis indexés par platId
   */
  async enrichDishesInBatches(
    dishes: InputDishForEnrichment[],
  ): Promise<Map<string, DishEnrichmentItemType>> {
    const resultMap = new Map<string, DishEnrichmentItemType>();

    if (!dishes || dishes.length === 0) {
      return resultMap;
    }

    this.logger.log(`[Enrichment] Début de l'enrichissement IA pour ${dishes.length} plat(s)...`);

    const pendingDishes: InputDishForEnrichment[] = [];

    // 1. Vérification du cache anti-doublons
    for (const dish of dishes) {
      const cacheKey = this.getCacheKey(dish.nom);
      if (this.cacheMap.has(cacheKey)) {
        const cachedItem = this.cacheMap.get(cacheKey)!;
        this.logger.log(`[Enrichment] Cache anti-doublons réutilisé pour: "${dish.nom}"`);
        resultMap.set(dish.platId, {
          ...cachedItem,
          platId: dish.platId,
        });
      } else {
        pendingDishes.push(dish);
      }
    }

    if (pendingDishes.length === 0) {
      this.logger.log('[Enrichment] Tous les plats proviennent du cache anti-doublons !');
      return resultMap;
    }

    // 2. Découpage en lots (Batching de 5 plats max)
    const BATCH_SIZE = 5;
    const batches: InputDishForEnrichment[][] = [];
    for (let i = 0; i < pendingDishes.length; i += BATCH_SIZE) {
      batches.push(pendingDishes.slice(i, i + BATCH_SIZE));
    }

    this.logger.log(`[Enrichment] Traitement de ${pendingDishes.length} plat(s) en ${batches.length} lot(s)...`);

    // 3. Exécution des batches via LlmService avec fallback automatique
    for (let bIndex = 0; bIndex < batches.length; bIndex++) {
      const batch = batches[bIndex];
      const prompt = BUILD_BATCH_ENRICHMENT_PROMPT(batch);
      const systemPrompt = 'Tu es un chef cuisinier expert en rédaction de menus gastronomiques. Réponds UNIQUEMENT en JSON.';

      const batchResult = await this.llmService.generateStructuredResponse<MenuEnrichmentBatchType>(
        prompt,
        MenuEnrichmentBatchSchema,
        systemPrompt,
      );

      if (batchResult && batchResult.plats && batchResult.plats.length > 0) {
        for (let i = 0; i < batchResult.plats.length; i++) {
          const item = batchResult.plats[i];
          const originalInput = batch[i] || batch.find((b) => b.platId === item.platId);
          const platId = item.platId || (originalInput ? originalInput.platId : '');

          if (platId) {
            const splitNom = SanitizerUtil.splitBilingualText(item.nom.fr || (originalInput ? originalInput.nom : ''));

            const sanitizedItem: DishEnrichmentItemType = {
              platId,
              nom: {
                fr: SanitizerUtil.cleanString(item.nom.fr || splitNom.fr),
                ar: SanitizerUtil.cleanString(item.nom.ar || splitNom.ar),
                en: SanitizerUtil.cleanString(item.nom.en || splitNom.en),
              },
              description: {
                fr: SanitizerUtil.cleanString(item.description.fr),
                ar: SanitizerUtil.cleanString(item.description.ar),
                en: SanitizerUtil.cleanString(item.description.en),
              },
              allergenes: SanitizerUtil.cleanAllergens(item.allergenes),
              tags: SanitizerUtil.cleanTags(item.tags),
            };

            resultMap.set(platId, sanitizedItem);

            if (originalInput) {
              const cacheKey = this.getCacheKey(originalInput.nom);
              this.cacheMap.set(cacheKey, sanitizedItem);
            }
          }
        }
      } else {
        // Fallback local en cas d'échec de tous les modèles Gemini pour ce lot
        this.logger.warn(`[Enrichment] ⚠️ Échec LLM sur le lot N°${bIndex + 1}. Activation du fallback local.`);
        for (const dish of batch) {
          const fallbackItem = this.getFallbackEnrichment(dish.nom, dish.platId, dish.descriptionExistante);
          resultMap.set(dish.platId, fallbackItem);
        }
      }
    }

    this.logger.log(`[Enrichment] Enrichissement terminé. Total plats: ${resultMap.size}`);
    return resultMap;
  }

  /**
   * Génère la clé de cache normalisée.
   */
  private getCacheKey(dishName: string): string {
    return dishName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  /**
   * Fallback local en cas d'échec de tous les modèles Gemini.
   */
  private getFallbackEnrichment(nom: string, platId?: string, descExistante?: string | null): DishEnrichmentItemType {
    const splitNom = SanitizerUtil.splitBilingualText(nom);
    const descText = descExistante || `${splitNom.fr} - Découvrez ce plat préparé par notre chef.`;

    return {
      platId: platId || '1',
      nom: {
        fr: splitNom.fr,
        ar: splitNom.ar,
        en: splitNom.en,
      },
      description: {
        fr: descText,
        ar: `${splitNom.ar} - استمتع بهذا الطبق المحضر من قبل طاهينا.`,
        en: `${splitNom.en} - Enjoy this dish prepared by our chef.`,
      },
      tags: ['Fait Maison'],
      allergenes: [],
    };
  }
}
