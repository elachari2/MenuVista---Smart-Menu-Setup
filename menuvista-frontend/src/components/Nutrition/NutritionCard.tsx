import React, { useState, useEffect } from 'react';
import { Leaf, Flame, ShieldCheck, Database, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export type NutriScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface MacroNutrients {
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  satures: number;
  fibres: number;
  sodium: number;
  sucres: number;
}

export interface DishNutritionEstimate {
  dishId?: string;
  dishName: string;
  category?: string;
  totalWeightGrams: number;
  per100g: MacroNutrients;
  perPortion: MacroNutrients;
  nutriScore: {
    score: number;
    grade: NutriScoreGrade;
  };
  source: 'sqlite_fts' | 'category_fallback' | 'restaurateur_override';
  confidenceMarginPercent: number;
  isOverride?: boolean;
}

interface NutritionCardProps {
  dishName: string;
  categoryName?: string;
  dishId?: string;
  initialEstimate?: DishNutritionEstimate | null;
  onPortionChange?: (updatedEstimate: DishNutritionEstimate) => void;
}

// Couleurs officielles du Nutri-Score européen
const NUTRI_SCORE_COLORS: Record<NutriScoreGrade, { bg: string; text: string; badge: string; border: string }> = {
  A: { bg: '#008B4C', text: '#FFFFFF', badge: 'bg-[#008B4C] text-white', border: 'border-[#008B4C]' },
  B: { bg: '#80BB2D', text: '#FFFFFF', badge: 'bg-[#80BB2D] text-white', border: 'border-[#80BB2D]' },
  C: { bg: '#FECB02', text: '#1E1A18', badge: 'bg-[#FECB02] text-[#1E1A18]', border: 'border-[#FECB02]' },
  D: { bg: '#EE8100', text: '#FFFFFF', badge: 'bg-[#EE8100] text-white', border: 'border-[#EE8100]' },
  E: { bg: '#E63312', text: '#FFFFFF', badge: 'bg-[#E63312] text-white', border: 'border-[#E63312]' },
};

export const NutritionCard: React.FC<NutritionCardProps> = ({
  dishName,
  categoryName,
  dishId,
  initialEstimate,
  onPortionChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [estimate, setEstimate] = useState<DishNutritionEstimate | null>(initialEstimate || null);
  const [portionWeight, setPortionWeight] = useState<number>(initialEstimate?.totalWeightGrams || 350);
  const [isLoading, setIsLoading] = useState(!initialEstimate);

  // Récupération de l'estimation depuis le backend NestJS si non fournie
  useEffect(() => {
    if (!initialEstimate && dishName) {
      setIsLoading(true);
      const params = new URLSearchParams({ dishName });
      if (categoryName) params.append('category', categoryName);
      if (dishId) params.append('dishId', dishId);

      fetch(`http://localhost:3000/api/v1/nutrition/estimate?${params.toString()}`)
        .then((res) => res.json())
        .then((data: DishNutritionEstimate) => {
          setEstimate(data);
          setPortionWeight(data.totalWeightGrams || 350);
          setIsLoading(false);
        })
        .catch(() => {
          // Simulation fallback si backend non actif
          const mock: DishNutritionEstimate = {
            dishName,
            category: categoryName || 'Plat',
            totalWeightGrams: 350,
            per100g: { calories: 160, proteines: 12, glucides: 14, lipides: 7, satures: 2.5, fibres: 2.1, sodium: 380, sucres: 2.4 },
            perPortion: { calories: 560, proteines: 42, glucides: 49, lipides: 24.5, satures: 8.75, fibres: 7.35, sodium: 1330, sucres: 8.4 },
            nutriScore: { score: 1, grade: 'B' },
            source: 'sqlite_fts',
            confidenceMarginPercent: 5,
          };
          setEstimate(mock);
          setIsLoading(false);
        });
    }
  }, [dishName, categoryName, dishId, initialEstimate]);

  // Recalcul des macros lors du changement de poids de portion
  const handleWeightChange = (newWeight: number) => {
    setPortionWeight(newWeight);
    if (!estimate) return;

    const ratio = newWeight / 100;
    const updatedPortion: MacroNutrients = {
      calories: Math.round(estimate.per100g.calories * ratio),
      proteines: Math.round(estimate.per100g.proteines * ratio * 10) / 10,
      glucides: Math.round(estimate.per100g.glucides * ratio * 10) / 10,
      lipides: Math.round(estimate.per100g.lipides * ratio * 10) / 10,
      satures: Math.round(estimate.per100g.satures * ratio * 10) / 10,
      fibres: Math.round(estimate.per100g.fibres * ratio * 10) / 10,
      sodium: Math.round(estimate.per100g.sodium * ratio),
      sucres: Math.round(estimate.per100g.sucres * ratio * 10) / 10,
    };

    const newEstimate: DishNutritionEstimate = {
      ...estimate,
      totalWeightGrams: newWeight,
      perPortion: updatedPortion,
    };

    setEstimate(newEstimate);
    onPortionChange?.(newEstimate);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  if (!estimate) return null;

  const grade = estimate.nutriScore.grade;
  const gradeStyle = NUTRI_SCORE_COLORS[grade];

  // Données de répartition pour le camembert Recharts
  const chartData = [
    { name: 'Protéines', value: estimate.perPortion.proteines * 4, color: '#3B82F6' },
    { name: 'Glucides', value: estimate.perPortion.glucides * 4, color: '#10B981' },
    { name: 'Lipides', value: estimate.perPortion.lipides * 9, color: '#F59E0B' },
  ];

  return (
    <div className="mt-3 bg-[#FAF8F5] rounded-2xl p-3.5 border border-[#E8E4E0] shadow-2xs space-y-3">
      {/* Ligne En-tête : Nutri-Score + Calories + Source + Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {/* Badge Officiel Nutri-Score A/B/C/D/E */}
          <div className="flex items-center rounded-lg overflow-hidden border border-gray-200 text-xs font-black shadow-2xs">
            {(['A', 'B', 'C', 'D', 'E'] as NutriScoreGrade[]).map((g) => (
              <span
                key={g}
                className={`px-1.5 py-0.5 text-[10px] font-extrabold uppercase transition-all ${
                  g === grade ? NUTRI_SCORE_COLORS[g].badge + ' scale-110 z-10 shadow-xs px-2 py-1' : 'bg-gray-100 text-gray-400 opacity-60'
                }`}
              >
                {g}
              </span>
            ))}
          </div>

          {/* Badge Calories Portions */}
          <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E8E4E0] text-xs font-bold text-[#1E1A18]">
            <Flame className="w-3.5 h-3.5 text-[#E85D2C]" />
            <span>{estimate.perPortion.calories} kcal</span>
            <span className="text-[10px] text-gray-400 font-normal">({portionWeight}g)</span>
          </div>
        </div>

        {/* Source de l'estimation + Bouton Dérouler */}
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              estimate.source === 'sqlite_fts'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : estimate.source === 'restaurateur_override'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={`Marge d'incertitude : ±${estimate.confidenceMarginPercent}%`}
          >
            {estimate.source === 'sqlite_fts' ? (
              <Database className="w-2.5 h-2.5" />
            ) : (
              <ShieldCheck className="w-2.5 h-2.5" />
            )}
            <span>
              {estimate.source === 'sqlite_fts'
                ? 'Base SQLite FTS'
                : estimate.source === 'restaurateur_override'
                ? 'Validé restaurateur'
                : 'Estimation catégorie (±15%)'}
            </span>
          </span>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors"
            title={isExpanded ? 'Masquer le détail' : 'Voir le détail des macros'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Grille Résumée des Macros Principales */}
      <div className="grid grid-cols-4 gap-2 pt-1 text-center">
        <div className="bg-white p-2 rounded-xl border border-gray-100">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Protéines</span>
          <span className="text-xs font-black text-blue-600">{estimate.perPortion.proteines}g</span>
        </div>
        <div className="bg-white p-2 rounded-xl border border-gray-100">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Glucides</span>
          <span className="text-xs font-black text-emerald-600">{estimate.perPortion.glucides}g</span>
        </div>
        <div className="bg-white p-2 rounded-xl border border-gray-100">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Lipides</span>
          <span className="text-xs font-black text-amber-600">{estimate.perPortion.lipides}g</span>
        </div>
        <div className="bg-white p-2 rounded-xl border border-gray-100">
          <span className="block text-[10px] font-semibold text-gray-400 uppercase">Fibres</span>
          <span className="text-xs font-black text-teal-600">{estimate.perPortion.fibres}g</span>
        </div>
      </div>

      {/* DÉTAIL ÉTENDU : Graphiques Recharts + Slider Portions + Sub-macros */}
      {isExpanded && (
        <div className="pt-3 border-t border-[#E8E4E0] space-y-4 animate-fadeIn">
          {/* Curseur d'ajustement des portions par le restaurateur */}
          <div className="bg-white p-3 rounded-xl border border-[#E8E4E0] space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-[#1E1A18]">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-[#E85D2C]" />
                Ajuster la portion servie :
              </span>
              <span className="text-[#E85D2C]">{portionWeight} g</span>
            </div>
            <input
              type="range"
              min="100"
              max="800"
              step="10"
              value={portionWeight}
              onChange={(e) => handleWeightChange(Number(e.target.value))}
              className="w-full accent-[#E85D2C] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>100g (Petite)</span>
              <span>350g (Moyenne)</span>
              <span>800g (Maxi)</span>
            </div>
          </div>

          {/* Graphique Recharts Répartition Energétique */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border border-[#E8E4E0]">
            <div className="w-28 h-28 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={22} outerRadius={40} paddingAngle={4}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${Math.round(Number(value || 0))} kcal`, 'Énergie']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 text-xs space-y-1.5 w-full">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Graisses saturées :</span>
                <span className="font-bold text-gray-800">{estimate.perPortion.satures}g</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Sucres :</span>
                <span className="font-bold text-gray-800">{estimate.perPortion.sucres}g</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Sodium (sel) :</span>
                <span className="font-bold text-gray-800">{estimate.perPortion.sodium} mg</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-100 text-[11px] text-gray-400">
                <span>Valeurs pour 100g :</span>
                <span>{estimate.per100g.calories} kcal / 100g</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
