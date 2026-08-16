import { Injectable, Logger } from '@nestjs/common';
import { NutritionDatasetService } from './nutrition-dataset.service';
import { CategoryAverage, DishNutritionEstimate, MacroNutrients } from './interfaces/nutrition.interface';
import { NutriScoreCalculatorService } from './nutriscore-calculator.service';

/**
 * Service de repli local par estimation catégorielle (SN-04)
 * Applique une moyenne catégorielle avec marge d'incertitude (±15%) et enregistre les surcharges restaurateur.
 */
@Injectable()
export class NutritionFallbackService {
  private readonly logger = new Logger(NutritionFallbackService.name);

  private readonly restaurateurOverrides = new Map<string, DishNutritionEstimate>();

  private readonly fallbackCategoryMap: Record<string, CategoryAverage & { portionGrams: number }> = {
    pizzas: { categoryName: 'Pizzas', avgCalories: 240, avgProteines: 10, avgGlucides: 28, avgLipides: 9, avgSatures: 4.2, avgFibres: 2.1, avgSodium: 550, avgSucres: 2.8, avgFruits: 15, portionGrams: 350 },
    burgers: { categoryName: 'Burgers', avgCalories: 260, avgProteines: 14, avgGlucides: 25, avgLipides: 12.5, avgSatures: 5.2, avgFibres: 1.5, avgSodium: 600, avgSucres: 4.2, avgFruits: 5, portionGrams: 250 },
    salades: { categoryName: 'Salades', avgCalories: 110, avgProteines: 8.5, avgGlucides: 4.5, avgLipides: 6.5, avgSatures: 1.8, avgFibres: 2, avgSodium: 380, avgSucres: 2, avgFruits: 60, portionGrams: 350 },
    pates: { categoryName: 'Pâtes', avgCalories: 160, avgProteines: 7, avgGlucides: 22, avgLipides: 5.5, avgSatures: 2.1, avgFibres: 1.6, avgSodium: 390, avgSucres: 2, avgFruits: 15, portionGrams: 360 },
    viandes: { categoryName: 'Viandes', avgCalories: 195, avgProteines: 24, avgGlucides: 0, avgLipides: 11, avgSatures: 4.3, avgFibres: 0, avgSodium: 75, avgSucres: 0, avgFruits: 0, portionGrams: 320 },
    poissons: { categoryName: 'Poissons', avgCalories: 145, avgProteines: 21, avgGlucides: 0.5, avgLipides: 6.5, avgSatures: 1.1, avgFibres: 0, avgSodium: 180, avgSucres: 0, avgFruits: 0, portionGrams: 295 },
    tajines: { categoryName: 'Tajines', avgCalories: 160, avgProteines: 14, avgGlucides: 6, avgLipides: 9, avgSatures: 2.2, avgFibres: 2, avgSodium: 410, avgSucres: 2.5, avgFruits: 40, portionGrams: 375 },
    couscous: { categoryName: 'Couscous', avgCalories: 155, avgProteines: 9.5, avgGlucides: 17, avgLipides: 5.5, avgSatures: 1.8, avgFibres: 2.8, avgSodium: 360, avgSucres: 2.4, avgFruits: 35, portionGrams: 435 },
    sushi: { categoryName: 'Sushi', avgCalories: 175, avgProteines: 6.5, avgGlucides: 28, avgLipides: 3.8, avgSatures: 0.7, avgFibres: 1.2, avgSodium: 320, avgSucres: 3.2, avgFruits: 15, portionGrams: 200 },
    desserts: { categoryName: 'Desserts', avgCalories: 280, avgProteines: 4.5, avgGlucides: 32, avgLipides: 15, avgSatures: 9, avgFibres: 1.2, avgSodium: 100, avgSucres: 24, avgFruits: 10, portionGrams: 150 },
    boissons: { categoryName: 'Boissons', avgCalories: 45, avgProteines: 0.2, avgGlucides: 10, avgLipides: 0.1, avgSatures: 0, avgFibres: 0.1, avgSodium: 5, avgSucres: 9.5, avgFruits: 30, portionGrams: 270 },
    legumes: { categoryName: 'Légumes', avgCalories: 60, avgProteines: 1.8, avgGlucides: 8, avgLipides: 1.5, avgSatures: 0.2, avgFibres: 2.5, avgSodium: 40, avgSucres: 3.5, avgFruits: 90, portionGrams: 350 },
    cereales: { categoryName: 'Céréales', avgCalories: 190, avgProteines: 6.5, avgGlucides: 32, avgLipides: 3.5, avgSatures: 1.1, avgFibres: 2.2, avgSodium: 350, avgSucres: 2.5, avgFruits: 5, portionGrams: 220 },
    entrées: { categoryName: 'Entrées', avgCalories: 150, avgProteines: 6, avgGlucides: 12, avgLipides: 8, avgSatures: 2.5, avgFibres: 1.8, avgSodium: 350, avgSucres: 2.5, avgFruits: 30, portionGrams: 250 },
  };

  constructor(
    private readonly datasetService: NutritionDatasetService,
    private readonly nutriScoreCalculator: NutriScoreCalculatorService,
  ) {}

  public getCategoryFallbackEstimate(dishName: string, category?: string): DishNutritionEstimate {
    const normCategory = (category || dishName).toLowerCase().trim();

    let matchKey = Object.keys(this.fallbackCategoryMap).find(
      (key) => normCategory.includes(key) || key.includes(normCategory),
    );

    if (!matchKey) matchKey = 'salades';
    const catAvg = this.fallbackCategoryMap[matchKey];

    const totalWeightGrams = catAvg.portionGrams || 350;
    const ratio = totalWeightGrams / 100;

    const per100g: MacroNutrients = {
      calories: catAvg.avgCalories,
      proteines: catAvg.avgProteines,
      glucides: catAvg.avgGlucides,
      lipides: catAvg.avgLipides,
      satures: catAvg.avgSatures,
      fibres: catAvg.avgFibres,
      sodium: catAvg.avgSodium,
      sucres: catAvg.avgSucres,
    };

    const perPortion: MacroNutrients = {
      calories: Math.round(catAvg.avgCalories * ratio),
      proteines: Math.round(catAvg.avgProteines * ratio * 10) / 10,
      glucides: Math.round(catAvg.avgGlucides * ratio * 10) / 10,
      lipides: Math.round(catAvg.avgLipides * ratio * 10) / 10,
      satures: Math.round(catAvg.avgSatures * ratio * 10) / 10,
      fibres: Math.round(catAvg.avgFibres * ratio * 10) / 10,
      sodium: Math.round(catAvg.avgSodium * ratio),
      sucres: Math.round(catAvg.avgSucres * ratio * 10) / 10,
    };

    const nutriScore = this.nutriScoreCalculator.calculateNutriScore(per100g, catAvg.avgFruits);

    return {
      dishName,
      category: catAvg.categoryName,
      totalWeightGrams,
      per100g,
      perPortion,
      nutriScore,
      source: 'category_fallback',
      confidenceMarginPercent: 15,
      parsedIngredients: [],
      isOverride: false,
    };
  }

  public saveRestaurateurOverride(dishId: string, override: DishNutritionEstimate): void {
    this.restaurateurOverrides.set(dishId, {
      ...override,
      dishId,
      source: 'restaurateur_override',
      isOverride: true,
      confidenceMarginPercent: 0,
    });
    this.logger.log(`[NutritionFallback] Surcharge enregistrée pour le plat ${dishId}`);
  }

  public getRestaurateurOverride(dishId: string): DishNutritionEstimate | null {
    return this.restaurateurOverrides.get(dishId) || null;
  }
}
