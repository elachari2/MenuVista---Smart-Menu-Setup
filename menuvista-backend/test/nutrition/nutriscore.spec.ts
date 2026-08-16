import { NutriScoreCalculatorService } from '../../src/modules/nutrition/nutriscore-calculator.service';
import { MacroNutrients } from '../../src/modules/nutrition/interfaces/nutrition.interface';

describe('NutriScoreCalculatorService', () => {
  let service: NutriScoreCalculatorService;

  beforeEach(() => {
    service = new NutriScoreCalculatorService();
  });

  it('devrait calculer la note A pour une salade fraîche équilibrée (très peu de calories, riche en fibres)', () => {
    const macrosSalade: MacroNutrients = {
      calories: 45,
      proteines: 3.5,
      glucides: 4,
      lipides: 1.2,
      satures: 0.2,
      fibres: 3.2,
      sodium: 80,
      sucres: 1.5,
    };

    const result = service.calculateNutriScore(macrosSalade, 80); // 80% fruits/légumes
    expect(result.grade).toBe('A');
    expect(result.score).toBeLessThanOrEqual(-1);
  });

  it('devrait calculer la note B pour un filet de saumon grillé avec riz', () => {
    const macrosSaumon: MacroNutrients = {
      calories: 160,
      proteines: 18,
      glucides: 12,
      lipides: 5.5,
      satures: 1.1,
      fibres: 1.5,
      sodium: 120,
      sucres: 0.5,
    };

    const result = service.calculateNutriScore(macrosSaumon, 20);
    expect(['A', 'B']).toContain(result.grade);
  });

  it('devrait calculer la note D ou E pour un burger double bacon riche en graisses saturées et sodium', () => {
    const macrosBurger: MacroNutrients = {
      calories: 320,
      proteines: 18,
      glucides: 28,
      lipides: 18,
      satures: 8.5,
      fibres: 1.2,
      sodium: 850,
      sucres: 5.5,
    };

    const result = service.calculateNutriScore(macrosBurger, 5);
    expect(['D', 'E']).toContain(result.grade);
    expect(result.score).toBeGreaterThan(10);
  });

  it('devrait appliquer correctement la règle de pénalité de protéines si les points négatifs sont >= 11', () => {
    const macrosHighNegative: MacroNutrients = {
      calories: 450,
      proteines: 25,
      glucides: 35,
      lipides: 25,
      satures: 12,
      fibres: 0.5,
      sodium: 950,
      sucres: 15,
    };

    const result = service.calculateNutriScore(macrosHighNegative, 0);
    expect(result.negativePoints.total).toBeGreaterThanOrEqual(11);
    expect(result.grade).toBe('E');
  });
});
