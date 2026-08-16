import { Injectable, Logger } from '@nestjs/common';
import Fuse from 'fuse.js';
import { NutritionDatasetService } from './nutrition-dataset.service';
import { FoodItem, ParsedIngredient } from './interfaces/nutrition.interface';

/**
 * Service de tokenisation, nettoyage et décomposition des intitulés et descriptions de plats en ingrédients.
 * Optimisé pour des temps de réponse < 5 ms par plat.
 */
@Injectable()
export class NutritionIngredientParserService {
  private readonly logger = new Logger(NutritionIngredientParserService.name);

  private readonly stopWords = new Set([
    'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'et', 'au', 'aux', 'avec', 'sans', 'sur', 'sous',
    'en', 'pour', 'façon', 'maison', 'sauce', 'style', 'lit', 'fraîche', 'fraîches', 'frais',
    'cuit', 'cuite', 'cuits', 'grillé', 'grillée', 'rôti', 'rôtie', 'poêlé', 'maison', 'traditionnel', 'délicieux',
    'special', 'spécial', 'plat', 'assiette', 'servi', 'servie', 'accompagné', 'accompagnée', 'gourmand', 'gourmande',
  ]);

  constructor(private readonly datasetService: NutritionDatasetService) {}

  /**
   * Décompose un plat en ingrédients et associe les aliments de la base SQLite FTS5 / Mémoire
   */
  public parseDishIngredients(dishName: string, description?: string | null): ParsedIngredient[] {
    const fullText = `${dishName} ${description || ''}`;
    const cleanTokens = this.tokenizeText(fullText);

    if (cleanTokens.length === 0) return [];

    const parsedIngredients: ParsedIngredient[] = [];
    const usedTerms = new Set<string>();

    // 1. Détection des expressions composées (2 mots)
    for (let i = 0; i < cleanTokens.length - 1; i++) {
      const pair = `${cleanTokens[i]} ${cleanTokens[i + 1]}`;
      if (usedTerms.has(cleanTokens[i]) || usedTerms.has(cleanTokens[i + 1])) continue;

      const matches = this.datasetService.searchFoodFTS(pair, 3);
      if (matches.length > 0) {
        const bestMatch = matches[0];
        parsedIngredients.push({
          rawTerm: pair,
          matchedFood: bestMatch,
          weightGrams: 150,
          confidenceScore: 90,
        });
        usedTerms.add(cleanTokens[i]);
        usedTerms.add(cleanTokens[i + 1]);
      }
    }

    // 2. Détection des termes individuels
    for (const token of cleanTokens) {
      if (usedTerms.has(token)) continue;

      const matches = this.datasetService.searchFoodFTS(token, 3);
      if (matches.length > 0) {
        const bestMatch = matches[0];
        parsedIngredients.push({
          rawTerm: token,
          matchedFood: bestMatch,
          weightGrams: 100,
          confidenceScore: 85,
        });
        usedTerms.add(token);
      }
    }

    return parsedIngredients;
  }

  private tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\sàâäéèêëîïôöùûüç]/gi, ' ')
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3 && !this.stopWords.has(t));
  }
}
