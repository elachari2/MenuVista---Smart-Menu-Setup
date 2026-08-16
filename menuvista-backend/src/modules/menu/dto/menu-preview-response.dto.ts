/**
 * DTO de réponse pour la prévisualisation d'un menu structuré et enrichi.
 */
export interface PlatPreviewDto {
  id: string;
  nom: { ar?: string; fr?: string; en?: string } | string;
  description?: { ar?: string; fr?: string; en?: string } | string | null;
  prix: number;
  devise?: string | null;
  statutValidation: string;
  sourceImage: string;
  imageUrl?: string | null;
  tags?: string[];
  allergenes?: string[];
}

export interface CategoriePreviewDto {
  id: string;
  nom: { ar?: string; fr?: string; en?: string } | string;
  ordre: number;
  plats: PlatPreviewDto[];
}

export interface MenuPreviewResponseDto {
  menuId: string;
  restaurant: {
    id: string;
    nom: string;
    adresse: string | null;
  };
  statut: string;
  langues: string[];
  categories: CategoriePreviewDto[];
  statistiques: {
    totalCategories: number;
    totalPlats: number;
    totalEnrichis?: number;
    tauxEnrichissement?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
