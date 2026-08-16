import { Controller, Get, Post, Body, Query, BadRequestException } from '@nestjs/common';
import { NutritionIngredientParserService } from './nutrition-ingredient-parser.service';
import { NutritionPortionService } from './nutrition-portion.service';
import { NutriScoreCalculatorService } from './nutriscore-calculator.service';
import { MacrosCalculatorService } from './macros-calculator.service';
import { NutritionFallbackService } from './nutrition-fallback.service';
import { NutritionDatasetService } from './nutrition-dataset.service';
import { DishNutritionEstimate, PortionAdjustmentDto, FoodItem } from './interfaces/nutrition.interface';

@Controller('nutrition')
export class NutritionController {
  constructor(
    private readonly datasetService: NutritionDatasetService,
    private readonly ingredientParser: NutritionIngredientParserService,
    private readonly portionService: NutritionPortionService,
    private readonly nutriScoreCalculator: NutriScoreCalculatorService,
    private readonly macrosCalculator: MacrosCalculatorService,
    private readonly fallbackService: NutritionFallbackService,
  ) {}

  /**
   * Endpoint GET /api/v1/nutrition/estimate
   * Estimation nutritionnelle locale instantanée (< 50 ms) avec Nutri-Score et Macros
   */
  @Get('estimate')
  async estimateNutrition(
    @Query('dishName') dishName: string,
    @Query('description') description?: string,
    @Query('category') category?: string,
    @Query('dishId') dishId?: string,
  ): Promise<DishNutritionEstimate> {
    if (!dishName || dishName.trim() === '') {
      throw new BadRequestException('Le paramètre dishName est obligatoire.');
    }

    // 1. Vérifier si une surcharge manuelle existe déjà pour ce plat
    if (dishId) {
      const override = this.fallbackService.getRestaurateurOverride(dishId);
      if (override) return override;
    }

    // 2. Décomposer le plat en ingrédients via FTS5 et Fuse.js
    let parsedIngredients = this.ingredientParser.parseDishIngredients(dishName, description);

    // 3. Si aucun ingrédient spécifique n'est reconnu, repli sur l'estimation catégorielle (SN-04)
    if (parsedIngredients.length === 0) {
      const fallback = this.fallbackService.getCategoryFallbackEstimate(dishName, category);
      if (dishId) fallback.dishId = dishId;
      return fallback;
    }

    // 4. Pondérer les poids d'ingrédients selon les règles de portions
    parsedIngredients = this.portionService.estimateIngredientWeights(parsedIngredients, category);

    // 5. Calculer les macros (per portion et per 100g)
    const { perPortion, per100g, totalWeightGrams } = this.macrosCalculator.calculateDishMacros(parsedIngredients);

    // 6. Calculer le Nutri-Score officiel
    const nutriScore = this.nutriScoreCalculator.calculateNutriScore(per100g, 0);

    return {
      dishId,
      dishName,
      category,
      totalWeightGrams,
      per100g,
      perPortion,
      nutriScore,
      source: 'sqlite_fts',
      confidenceMarginPercent: 5,
      parsedIngredients,
      isOverride: false,
    };
  }

  /**
   * Endpoint POST /api/v1/nutrition/override
   * Permet au restaurateur d'ajuster les portions ou surcharger l'estimation nutritionnelle
   */
  @Post('override')
  async overrideNutrition(@Body() body: { dishId: string; estimate: DishNutritionEstimate }): Promise<{ success: boolean; estimate: DishNutritionEstimate }> {
    if (!body.dishId || !body.estimate) {
      throw new BadRequestException('dishId et estimate sont requis.');
    }

    this.fallbackService.saveRestaurateurOverride(body.dishId, body.estimate);
    const updated = this.fallbackService.getRestaurateurOverride(body.dishId)!;

    return { success: true, estimate: updated };
  }

  /**
   * Endpoint GET /api/v1/nutrition/search-food
   * Recherche instantanée dans la base SQLite FTS (100 000+ aliments)
   */
  @Get('search-food')
  async searchFood(@Query('q') query: string, @Query('limit') limit?: number): Promise<FoodItem[]> {
    if (!query) return [];
    const maxLimit = limit ? Number(limit) : 10;
    return this.datasetService.searchFoodFTS(query, maxLimit);
  }
}
