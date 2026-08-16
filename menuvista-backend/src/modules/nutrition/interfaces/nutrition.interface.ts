/**
 * Interfaces pour le module de nutrition locale MenuVista
 */

export type NutriScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface NutriScoreBreakdown {
  score: number;
  grade: NutriScoreGrade;
  negativePoints: {
    energy: number;
    sugars: number;
    saturatedFat: number;
    sodium: number;
    total: number;
  };
  positivePoints: {
    fiber: number;
    protein: number;
    fruitsVegLegumes: number;
    total: number;
  };
}

export interface MacroNutrients {
  calories: number; // kcal
  proteines: number; // g
  glucides: number; // g
  lipides: number; // g
  satures: number; // g
  fibres: number; // g
  sodium: number; // mg
  sucres: number; // g
}

export interface FoodItem {
  code: string;
  name: string;
  category: string;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  satures: number;
  fibres: number;
  sodium: number;
  sucres: number;
  fruits: number; // % fruits / legumes / legumes sec / fruits a coque
}

export interface ParsedIngredient {
  rawTerm: string;
  matchedFood: FoodItem | null;
  weightGrams: number;
  confidenceScore: number;
}

export interface CategoryAverage {
  categoryName: string;
  avgCalories: number;
  avgProteines: number;
  avgGlucides: number;
  avgLipides: number;
  avgSatures: number;
  avgFibres: number;
  avgSodium: number;
  avgSucres: number;
  avgFruits: number;
}

export type EstimationSourceType = 'sqlite_fts' | 'category_fallback' | 'restaurateur_override';

export interface DishNutritionEstimate {
  dishId?: string;
  dishName: string;
  category?: string;
  totalWeightGrams: number;
  per100g: MacroNutrients;
  perPortion: MacroNutrients;
  nutriScore: NutriScoreBreakdown;
  source: EstimationSourceType;
  confidenceMarginPercent: number; // ex: 15%
  parsedIngredients: ParsedIngredient[];
  isOverride?: boolean;
}

export interface PortionAdjustmentDto {
  dishId?: string;
  totalWeightGrams?: number;
  ingredients?: Array<{
    foodCode: string;
    weightGrams: number;
  }>;
  customMacrosPerPortion?: Partial<MacroNutrients>;
}
