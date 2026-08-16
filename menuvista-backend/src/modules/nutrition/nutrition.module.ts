import { Module } from '@nestjs/common';
import { NutritionDatasetService } from './nutrition-dataset.service';
import { NutritionIngredientParserService } from './nutrition-ingredient-parser.service';
import { NutritionPortionService } from './nutrition-portion.service';
import { NutriScoreCalculatorService } from './nutriscore-calculator.service';
import { MacrosCalculatorService } from './macros-calculator.service';
import { NutritionFallbackService } from './nutrition-fallback.service';
import { NutritionController } from './nutrition.controller';

@Module({
  controllers: [NutritionController],
  providers: [
    NutritionDatasetService,
    NutritionIngredientParserService,
    NutritionPortionService,
    NutriScoreCalculatorService,
    MacrosCalculatorService,
    NutritionFallbackService,
  ],
  exports: [
    NutritionDatasetService,
    NutritionIngredientParserService,
    NutritionPortionService,
    NutriScoreCalculatorService,
    MacrosCalculatorService,
    NutritionFallbackService,
  ],
})
export class NutritionModule {}
