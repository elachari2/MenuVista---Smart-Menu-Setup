/**
 * Liste officielle des 14 allergènes majeurs (Réglementation Européenne / Restauration Internationale)
 */
export const OFFICIAL_ALLERGENS = [
  'Gluten',
  'Crustacés',
  'Œufs',
  'Poissons',
  'Arachides',
  'Soja',
  'Lait',
  'Fruits à coque',
  'Céleri',
  'Moutarde',
  'Sésame',
  'Sulfites',
  'Lupin',
  'Mollusques',
] as const;

/**
 * Liste officielle des tags contextuels et diététiques
 */
export const OFFICIAL_TAGS = [
  'Végétarien',
  'Végan',
  'Sans Gluten',
  'Sans Lactose',
  'Halal',
  'Épicé',
  'Fait Maison',
  'Spécialité',
] as const;

export interface MultilingualTextObj {
  fr: string;
  ar: string;
  en: string;
}

/**
 * Utilitaire de nettoyage, désinfection et validation rigoureuse des données issues des traitements OCR et IA.
 */
export class SanitizerUtil {
  /**
   * Nettoie une chaîne brute (supprime les balises HTML/Script, caractères de contrôle et espaces superflus).
   */
  static cleanString(str: string | null | undefined): string {
    if (!str) return '';
    return str
      .replace(/<[^>]*>/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Vérifie localement si une ligne d'entrée est une liste d'ingrédients/garniture.
   */
  static isIngredientLine(line: string): boolean {
    if (!line) return false;
    const clean = line.trim().toLowerCase();

    const commaCount = (clean.match(/,/g) || []).length;
    if (commaCount >= 2) return true;

    const ingredientWords = [
      'et',
      '&',
      'avec',
      'sans',
      'jus',
      'sauce',
      'crème',
      'sirop',
      'menthe',
      'citron',
      'glace',
      'rum',
      'vodka',
      'gin',
      'tequila',
      'garni',
      'servi',
    ];

    if (ingredientWords.some((w) => clean.includes(w)) && clean.length > 18) {
      return true;
    }

    return false;
  }

  /**
   * Sépare un texte bilingue ou mixte (ex: "Tajine طاجين").
   */
  static splitBilingualText(rawText: string): MultilingualTextObj {
    const cleaned = this.cleanString(rawText);
    if (!cleaned) return { fr: '', ar: '', en: '' };

    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
    const hasArabic = arabicRegex.test(cleaned);

    if (!hasArabic) {
      return { fr: cleaned, ar: cleaned, en: cleaned };
    }

    const words = cleaned.split(' ');
    const latinWords: string[] = [];
    const arabicWords: string[] = [];

    for (const word of words) {
      if (arabicRegex.test(word)) {
        arabicWords.push(word);
      } else {
        latinWords.push(word);
      }
    }

    const latinText = latinWords.join(' ').trim();
    const arabicText = arabicWords.join(' ').trim();

    const finalLatin = latinText || arabicText;
    const finalArabic = arabicText || latinText;

    return {
      fr: finalLatin,
      ar: finalArabic,
      en: finalLatin,
    };
  }

  /**
   * Extrait et nettoie un prix numérique valide avec précision absolue.
   */
  static cleanPrice(priceInput: unknown): number {
    if (typeof priceInput === 'number') {
      return isNaN(priceInput) || priceInput < 0 || priceInput >= 10000 ? 0 : Math.round(priceInput * 100) / 100;
    }

    if (typeof priceInput === 'string') {
      const sanitized = priceInput.replace(/,/g, '.').replace(/[^0-9.]/g, '');
      const parsed = parseFloat(sanitized);
      return isNaN(parsed) || parsed < 0 || parsed >= 10000 ? 0 : Math.round(parsed * 100) / 100;
    }

    return 0;
  }

  /**
   * Normalise le code ISO ou symbole monétaire de manière stricte et impartiale ($ , € , DH , £ , AED , LIRA...).
   */
  static formatCurrency(currencyInput: string | null | undefined): string {
    if (!currencyInput) return '$';
    const cleaned = this.cleanString(currencyInput).toUpperCase();

    if (cleaned === '$' || cleaned.includes('USD') || cleaned.includes('DOLLAR')) return '$';
    if (cleaned === '€' || cleaned.includes('EUR') || cleaned.includes('EURO')) return '€';
    if (cleaned.includes('DH') || cleaned.includes('MAD') || cleaned.includes('DIRHAM') || currencyInput.includes('د.م.')) return 'DH';
    if (cleaned.includes('AED') || currencyInput.includes('د.إ')) return 'AED';
    if (cleaned.includes('LIRA') || cleaned.includes('TL') || cleaned.includes('₺')) return 'LIRA';
    if (cleaned.includes('GBP') || cleaned.includes('£')) return '£';
    if (cleaned.includes('SAR')) return 'SAR';
    if (cleaned.includes('CAD')) return 'CAD';
    if (cleaned.includes('CHF')) return 'CHF';

    return cleaned.substring(0, 10) || '$';
  }

  /**
   * Validation Améliorée : Nettoie, déduplique et filtre les allergènes.
   */
  static cleanAllergens(allergensInput: unknown): string[] {
    if (!Array.isArray(allergensInput)) return [];

    const result = new Set<string>();

    for (const item of allergensInput) {
      if (typeof item !== 'string') continue;
      const cleanItem = this.cleanString(item);
      if (!cleanItem) continue;

      const matched = OFFICIAL_ALLERGENS.find(
        (official) => official.toLowerCase() === cleanItem.toLowerCase(),
      );

      if (matched) {
        result.add(matched);
      } else {
        const capitalized = cleanItem.charAt(0).toUpperCase() + cleanItem.slice(1).toLowerCase();
        result.add(capitalized);
      }
    }

    return Array.from(result);
  }

  /**
   * Validation Améliorée : Nettoie et déduplique les tags uniques.
   */
  static cleanTags(tagsInput: unknown): string[] {
    if (!Array.isArray(tagsInput)) return [];

    const result = new Set<string>();

    for (const item of tagsInput) {
      if (typeof item !== 'string') continue;
      const cleanItem = this.cleanString(item);
      if (!cleanItem) continue;

      const matched = OFFICIAL_TAGS.find(
        (official) => official.toLowerCase() === cleanItem.toLowerCase(),
      );

      if (matched) {
        result.add(matched);
      } else {
        const capitalized = cleanItem.charAt(0).toUpperCase() + cleanItem.slice(1).toLowerCase();
        result.add(capitalized);
      }
    }

    return Array.from(result);
  }
}
