import { Injectable } from '@nestjs/common';

/** Liste étendue des mots-clés de catégories courantes dans la restauration */
const COMMON_CATEGORY_KEYWORDS = [
  'TAPAS',
  'VIANDE',
  'VIANDES',
  'VIANDES MATURÉES',
  'VIANDES MATUREES',
  'POISSON',
  'POISSONS',
  'BURGER',
  'BURGERS',
  'SHAWARMA',
  'SHAWARMAS',
  'PIZZA',
  'PIZZAS',
  'ENTREE',
  'ENTREES',
  'ENTRÉES',
  'ENTRÉES POUR PATIENTER',
  'PATE',
  'PATES',
  'PÂTES',
  'PÂTES ET RISOTTOS',
  'SAUCES',
  'SAUCES, JUS & GARNITURES',
  'BOISSON',
  'BOISSONS',
  'DESSERT',
  'DESSERTS',
  'SALADE',
  'SALADES',
  'TAJINE',
  'TAJINES',
  'COUSCOUS',
  'GRILLADE',
  'GRILLADES',
  'SANDWICH',
  'SANDWICHS',
  'SANDWICHES',
  'SPECIALITE',
  'SPECIALITES',
  'SPÉCIALITÉS',
  'SNACK',
  'TAKEOUT',
  'DRINK',
  'DRINKS',
  'APPETIZER',
  'APPETIZERS',
  'MAIN COURSE',
  'SOUPE',
  'SOUPES',
  'PLAT',
  'PLATS',
  'NOS PLATS',
  'NOS SPECIALITES',
  'MENU ENFANT',
  'JUS',
  'ACCOMPAGNEMENT',
  'ACCOMPAGNEMENTS',
  'CREPE',
  'CREPES',
  'COCKTAIL',
  'COCKTAILS',
  'PETIT DEJEUNER',
  'BREAKFAST',
  'MENUS',
  'OFFRES',
];

/**
 * Service de découpage en blocs (Chunking) gérant la désimbrication des menus multi-colonnes complexes.
 */
@Injectable()
export class ChunkService {
  /**
   * Détecte les séparateurs de catégories dans le texte OCR
   * @param text Texte brut complet
   */
  detectCategorySeparators(text: string): string[] {
    const formattedText = this.splitMultiColumnText(text);
    const lines = formattedText.split('\n');
    const separators: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (this.isCategorySeparator(trimmed)) {
        separators.push(trimmed);
      }
    }

    return separators;
  }

  /**
   * Reconstruite les colonnes verticales si l'OCR a extrait les colonnes de gauche et droite sur les mêmes lignes horizontales
   * @param text Texte OCR brut
   */
  public splitMultiColumnText(text: string): string {
    const lines = text.split('\n');
    const leftColumn: string[] = [];
    const rightColumn: string[] = [];
    let isMultiColumnDetected = false;

    for (const line of lines) {
      // Séparation par grand espace (3+ espaces consécutifs ou tabulation)
      const parts = line.split(/\s{3,}|\t+/);
      if (parts.length >= 2 && parts[0].trim().length > 0 && parts[1].trim().length > 0) {
        isMultiColumnDetected = true;
        leftColumn.push(parts[0].trim());
        rightColumn.push(parts[1].trim());
      } else {
        leftColumn.push(line);
      }
    }

    if (isMultiColumnDetected && rightColumn.length > 0) {
      return `${leftColumn.join('\n')}\n\n${rightColumn.join('\n')}`;
    }

    return text;
  }

  /**
   * Découpe le texte en chunks (blocs) par catégorie en désimbriquant les colonnes
   * @param text Texte brut complet
   * @returns Map des catégories vers leur bloc de texte brut
   */
  chunkMenuByCategories(text: string): Map<string, string> {
    const formattedText = this.splitMultiColumnText(text);
    const chunks = new Map<string, string>();
    const lines = formattedText.split('\n');

    let currentCategory = 'PLATS';
    let currentChunk: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (this.isCategorySeparator(trimmed)) {
        if (currentChunk.length > 0) {
          const existing = chunks.get(currentCategory) || '';
          chunks.set(currentCategory, existing ? `${existing}\n${currentChunk.join('\n')}` : currentChunk.join('\n'));
        }
        currentCategory = this.formatCategoryName(trimmed);
        currentChunk = [];
      } else {
        currentChunk.push(line);
      }
    }

    if (currentChunk.length > 0) {
      const existing = chunks.get(currentCategory) || '';
      chunks.set(currentCategory, existing ? `${existing}\n${currentChunk.join('\n')}` : currentChunk.join('\n'));
    }

    return chunks;
  }

  /**
   * Nettoie et formate le nom de catégorie détecté
   */
  private formatCategoryName(raw: string): string {
    return raw
      .replace(/^[:\-\*\#\s\.\d\u2022•]+/g, '')
      .replace(/[:\s]+$/g, '')
      .trim()
      .toUpperCase();
  }

  /**
   * Détermine si une ligne est un en-tête de catégorie
   * @param line Ligne de texte à vérifier
   */
  public isCategorySeparator(line: string): boolean {
    const trimmed = line.trim();
    if (trimmed.length < 2 || trimmed.length > 45) return false;

    // 1. Si la ligne contient un prix ou un symbole monétaire -> C'est un PLAT, PAS UNE CATÉGORIE
    const hasPrice = /\d+(?:[.,]\d{1,2})?\s*(?:Dhs|DH|MAD|EUR|€|\$|AED|dt|tnd|lira|tl|£)?/i.test(trimmed) &&
      /(\d+[.,]\d{2}|\b\d{1,3}\s*(?:Dhs|DH|MAD|EUR|€|\$|AED)\b)/i.test(trimmed);
    if (hasPrice) return false;

    // 2. Si la ligne commence par un numéro de plat (ex: 315., 316., 1., 01.) -> C'est un PLAT
    if (/^\d{1,4}[\.\-\)\s]/.test(trimmed)) {
      return false;
    }

    // 3. Vérification des mots-clés de catégorie connus
    const upperLine = trimmed.toUpperCase();
    const isKnownKeyword = COMMON_CATEGORY_KEYWORDS.some((kw) => upperLine.includes(kw));
    if (isKnownKeyword && !/\d{2,}/.test(trimmed)) {
      return true;
    }

    // 4. Si la ligne se termine par un deux-points (ex: "Entrées:") -> Catégorie
    if (trimmed.endsWith(':') && !/\d/.test(trimmed)) {
      return true;
    }

    // 5. Si la ligne est entièrement en majuscules (ex: "TAPAS", "PÂTES ET RISOTTOS")
    const isPureUppercase = /^[A-ZÀÂÉÈÊËÎÏÔÛÙÜÇ\s\-\&\,\.\:\'\"]+$/.test(trimmed);
    if (isPureUppercase && trimmed.length >= 3 && trimmed.length <= 35) {
      return true;
    }

    return false;
  }
}
