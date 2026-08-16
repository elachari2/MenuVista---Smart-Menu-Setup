import { Injectable, Logger } from '@nestjs/common';
import { ParsedIngredient, PortionAdjustmentDto } from './interfaces/nutrition.interface';

/**
 * Service de calcul et de pondération intelligente des portions (ex: 160g volaille/steak + 90g accompagnement).
 */
@Injectable()
export class NutritionPortionService {
  private readonly logger = new Logger(NutritionPortionService.name);

  public estimateIngredientWeights(ingredients: ParsedIngredient[], category?: string): ParsedIngredient[] {
    if (ingredients.length === 0) return [];

    const normCategory = (category || '').toLowerCase();

    // S'il n'y a qu'un seul ingrédient détecté (ex: "Pizza", "Burger" ou "Dessert")
    if (ingredients.length === 1) {
      const single = ingredients[0];
      const cat = single.matchedFood?.category.toLowerCase() || '';
      let weight = 350;
      if (cat.includes('boissons') || normCategory.includes('boissons')) weight = 250;
      if (cat.includes('desserts') || normCategory.includes('desserts')) weight = 140;
      if (cat.includes('burgers') || normCategory.includes('burgers')) weight = 220;
      return [{ ...single, weightGrams: weight }];
    }

    // Répartition réaliste pour plats composés d'ingrédients multiples (ex: Steak + Frites)
    return ingredients.map((ing) => {
      let weight = 90;
      const cat = ing.matchedFood?.category.toLowerCase() || '';
      const name = ing.rawTerm.toLowerCase();

      if (cat.includes('viande') || cat.includes('poisson') || cat.includes('grillade') || name.includes('poulet') || name.includes('steak') || name.includes('saumon')) {
        weight = normCategory.includes('entrée') ? 90 : 160;
      } else if (name.includes('frite') || name.includes('patate')) {
        weight = 90;
      } else if (name.includes('riz') || name.includes('pate') || name.includes('spaghetti')) {
        weight = 120;
      } else if (cat.includes('sauce') || name.includes('sauce') || name.includes('beurre') || name.includes('huile')) {
        weight = 30;
      } else if (cat.includes('laitier') || cat.includes('fromage') || name.includes('fromage') || name.includes('mozzarella')) {
        weight = 35;
      } else if (cat.includes('pizza') || cat.includes('burger')) {
        weight = 300;
      }

      return {
        ...ing,
        weightGrams: weight,
      };
    });
  }

  public adjustPortions(
    baseIngredients: ParsedIngredient[],
    adjustments?: PortionAdjustmentDto,
  ): ParsedIngredient[] {
    if (!adjustments) return baseIngredients;

    let adjusted = [...baseIngredients];

    if (adjustments.ingredients && adjustments.ingredients.length > 0) {
      adjusted = adjusted.map((ing) => {
        const override = adjustments.ingredients?.find(
          (o) => ing.matchedFood && o.foodCode === ing.matchedFood.code,
        );
        if (override) {
          return { ...ing, weightGrams: override.weightGrams };
        }
        return ing;
      });
    }

    if (adjustments.totalWeightGrams && adjustments.totalWeightGrams > 0) {
      const currentTotal = adjusted.reduce((sum, ing) => sum + ing.weightGrams, 0);
      if (currentTotal > 0) {
        const ratio = adjustments.totalWeightGrams / currentTotal;
        adjusted = adjusted.map((ing) => ({
          ...ing,
          weightGrams: Math.round(ing.weightGrams * ratio),
        }));
      }
    }

    return adjusted;
  }
}
