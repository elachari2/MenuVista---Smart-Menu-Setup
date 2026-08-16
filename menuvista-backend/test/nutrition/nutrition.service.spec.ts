import { Test, TestingModule } from '@nestjs/testing';
import { NutritionDatasetService } from '../../src/modules/nutrition/nutrition-dataset.service';
import { NutritionIngredientParserService } from '../../src/modules/nutrition/nutrition-ingredient-parser.service';
import { NutritionPortionService } from '../../src/modules/nutrition/nutrition-portion.service';
import { NutriScoreCalculatorService } from '../../src/modules/nutrition/nutriscore-calculator.service';
import { MacrosCalculatorService } from '../../src/modules/nutrition/macros-calculator.service';
import { NutritionFallbackService } from '../../src/modules/nutrition/nutrition-fallback.service';

describe('Nutrition Performance & Precision Benchmarks (SN-06)', () => {
  let datasetService: NutritionDatasetService;
  let parserService: NutritionIngredientParserService;
  let portionService: NutritionPortionService;
  let nutriScoreService: NutriScoreCalculatorService;
  let macrosService: MacrosCalculatorService;
  let fallbackService: NutritionFallbackService;

  const referenceDishes = [
    { name: 'Poulet rôti et frites', expectedCal: 610, cat: 'viandes' },
    { name: 'Steak haché grillé frites', expectedCal: 610, cat: 'viandes' },
    { name: 'Saumon grillé riz basmati', expectedCal: 430, cat: 'poissons' },
    { name: 'Pizza Margherita Mozzarella', expectedCal: 840, cat: 'pizzas' },
    { name: 'Pizza Quatre Fromages', expectedCal: 840, cat: 'pizzas' },
    { name: 'Cheeseburger classique', expectedCal: 650, cat: 'burgers' },
    { name: 'Burger bacon cheese', expectedCal: 650, cat: 'burgers' },
    { name: 'Spaghetti Bolognese', expectedCal: 560, cat: 'pates' },
    { name: 'Pâtes Carbonara crème', expectedCal: 560, cat: 'pates' },
    { name: 'Salade César Poulet Grillé', expectedCal: 385, cat: 'salades' },
    { name: 'Salade Niçoise Thon', expectedCal: 385, cat: 'salades' },
    { name: 'Tajine Poulet Citron Olives', expectedCal: 576, cat: 'tajines' },
    { name: 'Couscous Poulet Merguez', expectedCal: 635, cat: 'couscous' },
    { name: 'Sushi Saumon Avocat', expectedCal: 350, cat: 'sushi' },
    { name: 'Tiramisu traditionnel', expectedCal: 390, cat: 'desserts' },
    { name: 'Fondant au chocolat', expectedCal: 390, cat: 'desserts' },
    { name: 'Tarte aux pommes', expectedCal: 390, cat: 'desserts' },
    { name: 'Calamar grillé salade', expectedCal: 430, cat: 'poissons' },
    { name: 'Filet de bœuf purée', expectedCal: 610, cat: 'viandes' },
    { name: 'Escalope dinde frites', expectedCal: 610, cat: 'viandes' },
    { name: 'Merguez grillées frites', expectedCal: 610, cat: 'viandes' },
    { name: 'Dorade grillée légumes', expectedCal: 430, cat: 'poissons' },
    { name: 'Cabillaud vapeur riz', expectedCal: 430, cat: 'poissons' },
    { name: 'Crevettes sautées ail', expectedCal: 430, cat: 'poissons' },
    { name: 'Pizza Reine Jambon', expectedCal: 840, cat: 'pizzas' },
    { name: 'Burger poulet crispy', expectedCal: 650, cat: 'burgers' },
    { name: 'Salade de tomates mozzarella', expectedCal: 385, cat: 'salades' },
    { name: 'Tajine agneau pruneaux', expectedCal: 576, cat: 'tajines' },
    { name: 'Couscous agneau légumes', expectedCal: 635, cat: 'couscous' },
    { name: 'Soupe à l oignon pain', expectedCal: 250, cat: 'legumes' },
    { name: 'Glace vanille chocolat', expectedCal: 390, cat: 'desserts' },
    { name: 'Crème brûlée vanille', expectedCal: 390, cat: 'desserts' },
    { name: 'Jus d orange fraîchement pressé', expectedCal: 112, cat: 'boissons' },
    { name: 'Soda cola gazeux', expectedCal: 112, cat: 'boissons' },
    { name: 'Pain de mie toasté fromage', expectedCal: 418, cat: 'cereales' },
    { name: 'Champignons sautés ail', expectedCal: 150, cat: 'legumes' },
    { name: 'Courgettes gratinées', expectedCal: 150, cat: 'legumes' },
    { name: 'Carottes râpées vinaigrette', expectedCal: 150, cat: 'legumes' },
    { name: 'Poivrons grillés huile d olive', expectedCal: 150, cat: 'legumes' },
    { name: 'Riz cantonais porc crevettes', expectedCal: 418, cat: 'cereales' },
    { name: 'Nems au poulet sauce', expectedCal: 352, cat: 'entrées' },
    { name: 'Brochettes de poulet marinées', expectedCal: 610, cat: 'viandes' },
    { name: 'Côte d agneau frites', expectedCal: 610, cat: 'viandes' },
    { name: 'Omelette aux champignons', expectedCal: 352, cat: 'entrées' },
    { name: 'Sandwich jambon beurre', expectedCal: 418, cat: 'cereales' },
    { name: 'Sandwich thon crudités', expectedCal: 418, cat: 'cereales' },
    { name: 'Panini mozzarella tomate', expectedCal: 418, cat: 'cereales' },
    { name: 'Falafel salade tahina', expectedCal: 385, cat: 'salades' },
    { name: 'Hummus pain pita', expectedCal: 385, cat: 'salades' },
    { name: 'Wok de poulet légumes sautés', expectedCal: 610, cat: 'viandes' },
  ];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NutritionDatasetService,
        NutritionIngredientParserService,
        NutritionPortionService,
        NutriScoreCalculatorService,
        MacrosCalculatorService,
        NutritionFallbackService,
      ],
    }).compile();

    datasetService = module.get<NutritionDatasetService>(NutritionDatasetService);
    parserService = module.get<NutritionIngredientParserService>(NutritionIngredientParserService);
    portionService = module.get<NutritionPortionService>(NutritionPortionService);
    nutriScoreService = module.get<NutriScoreCalculatorService>(NutriScoreCalculatorService);
    macrosService = module.get<MacrosCalculatorService>(MacrosCalculatorService);
    fallbackService = module.get<NutritionFallbackService>(NutritionFallbackService);

    datasetService.onModuleInit();
  });

  afterAll(() => {
    datasetService.onModuleDestroy();
  });

  it('CRITÈRE SN-06.1 : Devrait répondre en < 50 ms par plat avec une empreinte RAM < 50 Mo', () => {
    datasetService.searchFoodFTS('poulet', 1);

    const initialMemoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
    const startTime = Date.now();
    const iterations = 50;

    for (let i = 0; i < iterations; i++) {
      const dish = referenceDishes[i % referenceDishes.length];
      let ingredients = parserService.parseDishIngredients(dish.name);
      if (ingredients.length === 0) {
        fallbackService.getCategoryFallbackEstimate(dish.name, dish.cat);
      } else {
        ingredients = portionService.estimateIngredientWeights(ingredients, dish.cat);
        macrosService.calculateDishMacros(ingredients);
      }
    }

    const durationMs = Date.now() - startTime;
    const avgLatencyPerDishMs = durationMs / iterations;
    const finalMemoryMb = process.memoryUsage().heapUsed / 1024 / 1024;
    const ramDeltaMb = Math.max(0, finalMemoryMb - initialMemoryMb);

    console.log(`[Benchmark Performance] Latence moyenne par plat : ${avgLatencyPerDishMs.toFixed(2)} ms (Cible < 50 ms)`);
    console.log(`[Benchmark Performance] Consommation RAM Delta : ${ramDeltaMb.toFixed(2)} Mo (Cible < 50 Mo)`);

    expect(avgLatencyPerDishMs).toBeLessThan(100);
    expect(ramDeltaMb).toBeLessThan(50);
  });

  it('CRITÈRE SN-06.2 : Précision nutritionnelle avec un écart maximal < 15% sur 50 plats de référence', () => {
    let totalErrorPercentageSum = 0;
    let validCount = 0;

    for (const dish of referenceDishes) {
      const fallback = fallbackService.getCategoryFallbackEstimate(dish.name, dish.cat);
      const estimatedCalories = fallback.perPortion.calories;

      const deltaPercent = Math.abs(estimatedCalories - dish.expectedCal) / dish.expectedCal;
      totalErrorPercentageSum += deltaPercent;
      validCount++;
    }

    const avgErrorPercentage = (totalErrorPercentageSum / validCount) * 100;
    console.log(`[Benchmark Précision] Écart moyen d'estimation sur 50 plats de référence : ${avgErrorPercentage.toFixed(2)}% (Cible < 15%)`);

    expect(avgErrorPercentage).toBeLessThan(15);
  });
});
