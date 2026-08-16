/**
 * Statuts possibles d'un job de numérisation OCR.
 */
export type JobStatusEnum = 'recu' | 'ocr_en_cours' | 'ocr_termine' | 'echec';

/**
 * Réponse renvoyée après le téléversement d'un fichier de menu.
 */
export interface UploadResponse {
  jobId: string;
  status: string;
  message: string;
  createdAt: string;
}

/**
 * Réponse renvoyée lors de la consultation du statut d'un job.
 */
export interface JobStatusResponse {
  jobId: string;
  originalFilename: string;
  status: JobStatusEnum;
  ocrRawText: string | null;
  menuId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Nom ou texte multilingue */
export type MultilingualValue = { ar?: string; fr?: string; en?: string } | string;

export interface PlatNutritionValues {
  calories?: number;
  proteines?: number;
  glucides?: number;
  lipides?: number;
  fibres?: number;
  sodium?: number;
  sucres?: number;
  portion?: number;
}

/** Plat structuré pour la prévisualisation */
export interface PlatPreview {
  id: string;
  nom: MultilingualValue;
  description?: MultilingualValue | null;
  prix: number;
  devise?: string | null;
  statutValidation: string;
  sourceImage: string;
  imageUrl?: string | null;
  tags?: string[];
  allergenes?: string[];
  nutrition?: PlatNutritionValues;
}

/** Catégorie de menu structurée */
export interface CategoryPreview {
  id: string;
  nom: MultilingualValue;
  ordre: number;
  plats: PlatPreview[];
}

/** Réponse complète de prévisualisation du menu avec métriques d'enrichissement */
export interface MenuPreview {
  menuId: string;
  restaurant: {
    id: string;
    nom: string;
    adresse: string | null;
  };
  statut: string;
  langues: string[];
  categories: CategoryPreview[];
  statistiques: {
    totalCategories: number;
    totalPlats: number;
    totalEnrichis?: number;
    tauxEnrichissement?: number;
    prixMoyen?: number;
  };
  createdAt: string;
  updatedAt: string;
}
