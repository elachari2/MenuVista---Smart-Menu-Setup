import { Injectable } from '@nestjs/common';
import { MacroNutrients, ParsedIngredient } from './interfaces/nutrition.interface';

/**
 * Service de calcul et d'agrégation des macro-nutriments d'un plat (Calories, Protéines, Glucides, Lipides, Fibres, Sodium, Sucres).
 */
@Injectable()
export class MacrosCalculatorService {
  /**
   * Calcule les macros totales d'un plat à partir de la liste de ses ingrédients pondérés
   */
  public calculateDishMacros(ingredients: ParsedIngredient[]): { perPortion: MacroNutrients; per100g: MacroNutrients; totalWeightGrams: number } {
    if (!ingredients || ingredients.length === 0) {
      const zeroMacros: MacroNutrients = { calories: 0, proteines: 0, glucides: 0, lipides: 0, satures: 0, fibres: 0, sodium: 0, sucres: 0 };
      return { perPortion: zeroMacros, per100g: zeroMacros, totalWeightGrams: 0 };
    }

    let totalWeight = 0;
    let sumCal = 0;
    let sumProt = 0;
    let sumGluc = 0;
    let sumLip = 0;
    let sumSat = 0;
    let sumFib = 0;
    let sumSod = 0;
    let sumSuc = 0;

    for (const ing of ingredients) {
      if (!ing.matchedFood || ing.weightGrams <= 0) continue;

      const factor = ing.weightGrams / 100;
      const food = ing.matchedFood;

      totalWeight += ing.weightGrams;
      sumCal += food.calories * factor;
      sumProt += food.proteines * factor;
      sumGluc += food.glucides * factor;
      sumLip += food.lipides * factor;
      sumSat += food.satures * factor;
      sumFib += food.fibres * factor;
      sumSod += food.sodium * factor;
      sumSuc += food.sucres * factor;
    }

    const totalWeightGrams = totalWeight > 0 ? totalWeight : 350;

    const perPortion: MacroNutrients = {
      calories: Math.round(sumCal),
      proteines: Math.round(sumProt * 10) / 10,
      glucides: Math.round(sumGluc * 10) / 10,
      lipides: Math.round(sumLip * 10) / 10,
      satures: Math.round(sumSat * 10) / 10,
      fibres: Math.round(sumFib * 10) / 10,
      sodium: Math.round(sumSod),
      sucres: Math.round(sumSuc * 10) / 10,
    };

    const ratio100g = 100 / totalWeightGrams;

    const per100g: MacroNutrients = {
      calories: Math.round(sumCal * ratio100g),
      proteines: Math.round(sumProt * ratio100g * 10) / 10,
      glucides: Math.round(sumGluc * ratio100g * 10) / 10,
      lipides: Math.round(sumLip * ratio100g * 10) / 10,
      satures: Math.round(sumSat * ratio100g * 10) / 10,
      fibres: Math.round(sumFib * ratio100g * 10) / 10,
      sodium: Math.round(sumSod * ratio100g),
      sucres: Math.round(sumSuc * ratio100g * 10) / 10,
    };

    return { perPortion, per100g, totalWeightGrams };
  }
}
