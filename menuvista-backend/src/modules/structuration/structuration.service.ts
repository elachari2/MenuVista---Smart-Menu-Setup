import { Injectable } from '@nestjs/common';
import { ChunkService } from './chunk.service';
import { AppLogger } from '../../common/logger/logger.util';
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
 * Service de structuration locale par blocs (Chunking) avec détection impartiale des devises ($, €, DH, AED, LIRA, £).
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

    // Détection impartiale de la devise globale du menu ($ , € , DH , AED , LIRA , £)
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

        // Extraction d'un nouveau plat dans ce bloc
        const plat = this.extractDishFromLine(line, globalCurrency);
        if (plat) {
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
   * Détecte la vraie devise dominante utilisée sur l'ensemble du menu
   */
  private detectGlobalCurrency(text: string): string {
    if (/\$|USD|DOLLAR/i.test(text)) return '$';
    if (/€|EUR|EURO/i.test(text)) return '€';
    if (/£|GBP|POUND/i.test(text)) return '£';
    if (/AED|د\.إ/i.test(text)) return 'AED';
    if (/LIRA|TL|₺/i.test(text)) return 'LIRA';
    if (/Dhs|DH|MAD|د\.م\./i.test(text)) return 'DH';
    return '$';
  }

  private isDescriptionLine(line: string): boolean {
    const startsWithLowercase = /^[a-zàâéèêëîïôûùüç]/.test(line);
    const containsKeywords = /(sauce|accompagné|ingrédients|herbes|piment|confit|marinés|frites|salade|citron|basilic|pain|pomme de terre)/i.test(line);
    const hasPrice = /\d{1,3}\s*(Dhs|DH|MAD|EUR|€|\$|AED|LIRA)/i.test(line) || /\b\d+[.,]\d{2}\b/.test(line);

    return (startsWithLowercase || containsKeywords || line.startsWith('(')) && !hasPrice;
  }

  private extractDishFromLine(line: string, defaultCurrency: string = '$'): PlatVisionType | null {
    // Nettoyer les préfixes de numérotation comme 315., 316., 1., 01.
    let cleanedLine = line.replace(/^\d{1,4}[\.\-\)\s]+/, '').trim();

    // Expression régulière de recherche de prix et devise (ex: 8 $, 9 $, 99 Dhs, 159 Dhs, 14 AED, 12 €)
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
        const parsed = parseFloat(priceStr.replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0 && parsed < 5000) {
          extractedPrice = parsed;
        }
      }

      if (currStr) {
        const u = currStr.toUpperCase();
        if (currStr === '$' || u === 'USD') {
          extractedCurrency = '$';
        } else if (currStr === '€' || u === 'EUR') {
          extractedCurrency = '€';
        } else if (currStr.toLowerCase() === 'dhs' || u === 'DH' || u === 'MAD') {
          extractedCurrency = 'DH';
        } else if (currStr === '£' || u === 'GBP') {
          extractedCurrency = '£';
        } else {
          extractedCurrency = u;
        }
      }

      rawDishName = cleanedLine.replace(match[0], '').trim();
    } else {
      // Deuxième tentative : recherche d'un nombre isolé à la fin de la ligne du plat (ex: "Mojito ... 8")
      const fallbackPriceMatch = cleanedLine.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:les\s*\d+\s*g[r]?|dhs|dh|mad|€|\$|aed|lira)?\s*$/i);
      if (fallbackPriceMatch) {
        const parsed = parseFloat(fallbackPriceMatch[1].replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0 && parsed < 5000) {
          extractedPrice = parsed;
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
      prix_incertain: isPriceUncertain,
      nom_incertain: false,
    };
  }
}
