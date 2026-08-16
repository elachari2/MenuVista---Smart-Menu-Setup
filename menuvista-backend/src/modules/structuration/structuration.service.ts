import { Injectable } from '@nestjs/common';
import { ChunkService } from './chunk.service';
import { AppLogger } from '../../common/logger/logger.util';
import { SanitizerUtil } from '../../common/utils/sanitizer.util';
import {
  UnifiedMenuExtractionType,
  CategorieVisionType,
  PlatVisionType,
} from '../llm/schemas/vision.schema';

/** Phrases explicatives marketing à ignorer au niveau des descriptions de plats uniquement */
const MARKETING_DESCRIPTION_PATTERNS = [
  /importé/i,
  /cuisson au/i,
  /nos soins/i,
  /minimum 30/i,
];

/**
 * Service de structuration locale par blocs (Chunking) ultra-stricte avec détection fréquentielle des devises ($, €, DH, AED, LIRA, £).
 */
@Injectable()
export class StructurationService {
  constructor(
    private readonly chunkService: ChunkService,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Analyse et transforme le texte OCR brut en structure de menu via découpage par blocs.
   * @param ocrText Texte brut extrait par l'OCR
   */
  parseOcrText(ocrText: string): UnifiedMenuExtractionType {
    const context = 'StructurationService';
    this.logger.log('Début de la structuration locale par blocs (Chunking)...', context);

    if (!ocrText || ocrText.trim().length === 0) {
      return {
        categories: [{ nom: 'Menu Principal', plats: [] }],
        statistiques: { total_categories: 1, total_plats: 0, plats_sans_prix: 0 },
      };
    }

    // Détection fréquentielle impartiale de la vraie devise dominante du menu ($ , € , DH , AED , LIRA , £)
    const globalCurrency = this.detectGlobalCurrency(ocrText);

    // Découpage du texte en blocs par catégorie (désimbrication des colonnes incluses)
    const chunks = this.chunkService.chunkMenuByCategories(ocrText);
    const categories: CategorieVisionType[] = [];
    let totalPlats = 0;
    let platsSansPrix = 0;

    for (const [rawCatName, chunkText] of chunks.entries()) {
      const catName = rawCatName.trim();
      if (!catName || catName.length < 2) continue;

      const categoryPlats: PlatVisionType[] = [];
      const lines = chunkText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      for (const line of lines) {
        // Ignorer uniquement les lignes purement marketing sans prix ni nom de plat
        if (MARKETING_DESCRIPTION_PATTERNS.some((pat) => pat.test(line)) && !/\d{2,}/.test(line)) {
          continue;
        }

        const lastPlat = categoryPlats[categoryPlats.length - 1];

        // Rattachement des descriptions ou ingrédients au plat précédent
        if (lastPlat && this.isDescriptionLine(line)) {
          const cleanedDesc = line.replace(/^[*\u2022•«»\-\s.]+/g, '').trim();
          if (lastPlat.description) {
            lastPlat.description += ` ${cleanedDesc}`;
          } else {
            lastPlat.description = cleanedDesc;
          }
          continue;
        }

        // Extraction d'un ou plusieurs plats (gestion des lignes à variantes multiples "33cl 3$ / 50cl 5$")
        const extractedPlats = this.extractDishesFromLine(line, globalCurrency);
        for (const plat of extractedPlats) {
          categoryPlats.push(plat);
          totalPlats++;
          if (plat.prix === null || plat.prix_incertain) {
            platsSansPrix++;
          }
        }
      }

      if (categoryPlats.length > 0) {
        categories.push({
          nom: catName,
          plats: categoryPlats,
        });
      }
    }

    return {
      devise: globalCurrency,
      categories: categories.length > 0 ? categories : [{ nom: 'Général', plats: [] }],
      statistiques: {
        total_categories: categories.length,
        total_plats: totalPlats,
        plats_sans_prix: platsSansPrix,
      },
    };
  }

  /**
   * Détecte la vraie devise dominante utilisée sur l'ensemble du menu via analyse fréquentielle
   */
  public detectGlobalCurrency(text: string): string {
    const counts = {
      '$': (text.match(/\$|USD|DOLLAR/gi) || []).length,
      '€': (text.match(/€|EUR|EURO/gi) || []).length,
      'DH': (text.match(/Dhs|DH|MAD|د\.م\./gi) || []).length,
      '£': (text.match(/£|GBP|POUND/gi) || []).length,
      'AED': (text.match(/AED|د\.إ/gi) || []).length,
      'LIRA': (text.match(/LIRA|TL|₺/gi) || []).length,
    };

    let maxCurrency = '$';
    let maxCount = 0;

    for (const [curr, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        maxCurrency = curr;
      }
    }

    return maxCurrency;
  }

  private isDescriptionLine(line: string): boolean {
    const startsWithLowercase = /^[a-zàâéèêëîïôûùüç]/.test(line);
    const containsKeywords = /(sauce|accompagné|ingrédients|herbes|piment|confit|marinés|frites|salade|citron|basilic|pain|pomme de terre)/i.test(line);
    const hasPrice = /\d{1,3}\s*(Dhs|DH|MAD|EUR|€|\$|AED|LIRA|TL|£|GBP)/i.test(line) || /\b\d+[.,]\d{2}\b/.test(line);

    return (startsWithLowercase || containsKeywords || line.startsWith('(')) && !hasPrice;
  }

  /**
   * Extrait un ou plusieurs plats d'une ligne (gère les variantes séparées par "/" ou "|")
   */
  private extractDishesFromLine(line: string, defaultCurrency: string = '$'): PlatVisionType[] {
    // Si la ligne contient plusieurs prix séparés par des slashs ou des barres (ex: "33cl 3$ / 50cl 5$" ou "Verre 5€ / Bouteille 22€")
    if ((line.includes('/') || line.includes('|')) && (line.match(/\d/g) || []).length >= 2) {
      const parts = line.split(/[/|]/).map((p) => p.trim()).filter((p) => p.length > 0);
      const results: PlatVisionType[] = [];

      let baseName = '';
      for (const part of parts) {
        const dish = this.extractSingleDish(part, defaultCurrency);
        if (dish) {
          if (!baseName) {
            baseName = dish.nom as string;
          } else if (dish.nom && (dish.nom as string).length < 6) {
            // Si la variante n'a qu'un nom court (ex: "50cl"), préfixer avec le nom principal
            dish.nom = `${baseName} (${dish.nom})`;
          }
          results.push(dish);
        }
      }

      if (results.length > 0) return results;
    }

    const single = this.extractSingleDish(line, defaultCurrency);
    return single ? [single] : [];
  }

  /**
   * Extrait un plat unique d'une portion de ligne avec nettoyage strict
   */
  private extractSingleDish(line: string, defaultCurrency: string = '$'): PlatVisionType | null {
    // Nettoyer les préfixes de numérotation comme "315.", "316.", "01.", "1-", "2)"
    let cleanedLine = line.replace(/^\d{1,4}[\.\-\)\s]+/, '').trim();

    // Recherche d'unités de mesure (33cl, 50cl, 250g, 1L, etc.)
    let extractedUnit: string | null = null;
    const unitMatch = cleanedLine.match(/\b(\d{1,4}\s*(?:cl|ml|l|g|kg))\b/i);
    if (unitMatch) {
      extractedUnit = unitMatch[1].trim();
      cleanedLine = cleanedLine.replace(unitMatch[0], '').trim();
    }

    // Expression régulière universelle de prix et devise
    const priceWithCurrencyRegex = /(?:(\d+(?:[.,]\d{1,2})?)\s*(Dhs|DH|MAD|EUR|€|\$|USD|AED|LIRA|TL|£|GBP|SAR))|(?:(Dhs|DH|MAD|EUR|€|\$|USD|AED|LIRA|TL|£|GBP|SAR)\s*(\d+(?:[.,]\d{1,2})?))|(?:\.\.\.\s*(\d+(?:[.,]\d{1,2})?))/i;
    const match = cleanedLine.match(priceWithCurrencyRegex);

    let rawDishName = cleanedLine;
    let extractedPrice: number | null = null;
    let extractedCurrency: string = defaultCurrency;
    let isPriceUncertain = false;

    if (match) {
      const priceStr = match[1] || match[4] || match[5];
      const currStr = match[2] || match[3];

      if (priceStr) {
        extractedPrice = SanitizerUtil.cleanPrice(priceStr);
        if (extractedPrice === 0 && !priceStr.includes('0')) {
          extractedPrice = null;
          isPriceUncertain = true;
        }
      }

      if (currStr) {
        extractedCurrency = SanitizerUtil.formatCurrency(currStr);
      }

      rawDishName = cleanedLine.replace(match[0], '').trim();
    } else {
      // Deuxième tentative : recherche d'un nombre isolé à la fin de la ligne (ex: "Mojito ... 8")
      const fallbackPriceMatch = cleanedLine.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:les\s*\d+\s*g[r]?|dhs|dh|mad|€|\$|aed|lira)?\s*$/i);
      if (fallbackPriceMatch) {
        const parsedPrice = SanitizerUtil.cleanPrice(fallbackPriceMatch[1]);
        if (parsedPrice > 0) {
          extractedPrice = parsedPrice;
          rawDishName = cleanedLine.replace(fallbackPriceMatch[0], '').trim();
        } else {
          isPriceUncertain = true;
        }
      } else {
        isPriceUncertain = true;
      }
    }

    const cleanedName = rawDishName
      .replace(/^[*\u2022•«»\-\s.]+/g, '')
      .replace(/[.\s\u2026]+$/g, '')
      .replace(/\s*\.\.\.\s*$/g, '')
      .trim();

    if (cleanedName.length < 2) {
      return null;
    }

    return {
      nom: cleanedName,
      description: null,
      prix: extractedPrice,
      devise: extractedCurrency,
      unite: extractedUnit,
      prix_incertain: isPriceUncertain,
      nom_incertain: false,
    };
  }
}
