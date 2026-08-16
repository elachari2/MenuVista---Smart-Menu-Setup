import { Injectable } from '@nestjs/common';
import { MacroNutrients, NutriScoreBreakdown, NutriScoreGrade } from './interfaces/nutrition.interface';

/**
 * Service de calcul officiel du Nutri-Score (Note A, B, C, D, E et score numérique)
 * basé sur le barème réglementaire européen (Points négatifs N vs Points positifs P pour 100g).
 */
@Injectable()
export class NutriScoreCalculatorService {
  /**
   * Calcule le Nutri-Score officiel à partir des macro-nutriments pour 100g de plat
   */
  public calculateNutriScore(macrosPer100g: MacroNutrients, fruitsPercent: number = 0): NutriScoreBreakdown {
    // 1. Convertir les calories (kcal) en Energie (kJ) : 1 kcal = 4.184 kJ
    const energyKj = macrosPer100g.calories * 4.184;
    const sugarsG = macrosPer100g.sucres;
    const satFatG = macrosPer100g.satures;
    const sodiumMg = macrosPer100g.sodium;
    const fiberG = macrosPer100g.fibres;
    const proteinG = macrosPer100g.proteines;

    // 2. Points Négatifs (N) - Max 40 points (10 points max par composante)
    const pointsEnergy = this.getEnergyPoints(energyKj);
    const pointsSugars = this.getSugarsPoints(sugarsG);
    const pointsSatFat = this.getSatFatPoints(satFatG);
    const pointsSodium = this.getSodiumPoints(sodiumMg);

    const totalNegative = pointsEnergy + pointsSugars + pointsSatFat + pointsSodium;

    // 3. Points Positifs (P) - Max 15 points (5 points max par composante)
    const pointsFruits = this.getFruitsPoints(fruitsPercent);
    const pointsFiber = this.getFiberPoints(fiberG);
    const pointsProtein = this.getProteinPoints(proteinG);

    // 4. Règle spéciale de calcul du total Nutri-Score :
    // Si les points négatifs sont >= 11, la protéine n'est comptabilisée QUE SI les points fruits/légumes sont >= 5.
    let totalPositive = 0;
    if (totalNegative >= 11 && pointsFruits < 5) {
      totalPositive = pointsFruits + pointsFiber;
    } else {
      totalPositive = pointsFruits + pointsFiber + pointsProtein;
    }

    const finalScore = totalNegative - totalPositive;
    const grade = this.scoreToGrade(finalScore);

    return {
      score: finalScore,
      grade,
      negativePoints: {
        energy: pointsEnergy,
        sugars: pointsSugars,
        saturatedFat: pointsSatFat,
        sodium: pointsSodium,
        total: totalNegative,
      },
      positivePoints: {
        fiber: pointsFiber,
        protein: pointsProtein,
        fruitsVegLegumes: pointsFruits,
        total: totalPositive,
      },
    };
  }

  // --- Barèmes des Points Négatifs (pour 100g) ---

  private getEnergyPoints(energyKj: number): number {
    if (energyKj <= 335) return 0;
    if (energyKj <= 670) return 1;
    if (energyKj <= 1005) return 2;
    if (energyKj <= 1340) return 3;
    if (energyKj <= 1675) return 4;
    if (energyKj <= 2010) return 5;
    if (energyKj <= 2345) return 6;
    if (energyKj <= 2680) return 7;
    if (energyKj <= 3015) return 8;
    if (energyKj <= 3350) return 9;
    return 10;
  }

  private getSugarsPoints(sugarsG: number): number {
    if (sugarsG <= 4.5) return 0;
    if (sugarsG <= 9) return 1;
    if (sugarsG <= 13.5) return 2;
    if (sugarsG <= 18) return 3;
    if (sugarsG <= 22.5) return 4;
    if (sugarsG <= 27) return 5;
    if (sugarsG <= 31) return 6;
    if (sugarsG <= 36) return 7;
    if (sugarsG <= 40) return 8;
    if (sugarsG <= 45) return 9;
    return 10;
  }

  private getSatFatPoints(satFatG: number): number {
    if (satFatG <= 1) return 0;
    if (satFatG <= 2) return 1;
    if (satFatG <= 3) return 2;
    if (satFatG <= 4) return 3;
    if (satFatG <= 5) return 4;
    if (satFatG <= 6) return 5;
    if (satFatG <= 7) return 6;
    if (satFatG <= 8) return 7;
    if (satFatG <= 9) return 8;
    if (satFatG <= 10) return 9;
    return 10;
  }

  private getSodiumPoints(sodiumMg: number): number {
    if (sodiumMg <= 90) return 0;
    if (sodiumMg <= 180) return 1;
    if (sodiumMg <= 270) return 2;
    if (sodiumMg <= 360) return 3;
    if (sodiumMg <= 450) return 4;
    if (sodiumMg <= 540) return 5;
    if (sodiumMg <= 630) return 6;
    if (sodiumMg <= 720) return 7;
    if (sodiumMg <= 810) return 8;
    if (sodiumMg <= 900) return 9;
    return 10;
  }

  // --- Barèmes des Points Positifs (pour 100g) ---

  private getFruitsPoints(fruitsPercent: number): number {
    if (fruitsPercent <= 40) return 0;
    if (fruitsPercent <= 60) return 1;
    if (fruitsPercent <= 80) return 2;
    return 5;
  }

  private getFiberPoints(fiberG: number): number {
    if (fiberG <= 0.9) return 0;
    if (fiberG <= 1.9) return 1;
    if (fiberG <= 2.8) return 2;
    if (fiberG <= 3.7) return 3;
    if (fiberG <= 4.7) return 4;
    return 5;
  }

  private getProteinPoints(proteinG: number): number {
    if (proteinG <= 1.6) return 0;
    if (proteinG <= 3.2) return 1;
    if (proteinG <= 4.8) return 2;
    if (proteinG <= 6.4) return 3;
    if (proteinG <= 8.0) return 4;
    return 5;
  }

  // --- Conversion du score numérique en lettre A/B/C/D/E ---

  private scoreToGrade(score: number): NutriScoreGrade {
    if (score <= -1) return 'A';
    if (score <= 2) return 'B';
    if (score <= 10) return 'C';
    if (score <= 18) return 'D';
    return 'E';
  }
}
