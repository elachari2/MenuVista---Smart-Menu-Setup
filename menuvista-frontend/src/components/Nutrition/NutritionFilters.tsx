import React from 'react';
import { Filter, Flame, Zap, Shield, RotateCcw } from 'lucide-react';
import { NutriScoreGrade } from './NutritionCard';

export interface NutritionFilterState {
  nutriScore: 'all' | 'AB' | 'A' | 'B' | 'C' | 'D' | 'E';
  maxCalories: 'all' | '300' | '500' | '800';
  minProtein: 'all' | '15' | '25';
  lowSodiumOnly: boolean;
}

interface NutritionFiltersProps {
  filters: NutritionFilterState;
  onFilterChange: (newFilters: NutritionFilterState) => void;
  activeCount?: number;
  totalCount?: number;
}

export const NutritionFilters: React.FC<NutritionFiltersProps> = ({
  filters,
  onFilterChange,
  activeCount,
  totalCount,
}) => {
  const handleReset = () => {
    onFilterChange({
      nutriScore: 'all',
      maxCalories: 'all',
      minProtein: 'all',
      lowSodiumOnly: false,
    });
  };

  const isFiltered =
    filters.nutriScore !== 'all' ||
    filters.maxCalories !== 'all' ||
    filters.minProtein !== 'all' ||
    filters.lowSodiumOnly;

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E8E4E0] shadow-2xs space-y-3">
      {/* En-tête de la barre de filtrage nutritionnel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-black text-[#1E1A18]">
          <Filter className="w-4 h-4 text-[#E85D2C]" />
          <span>Filtres Nutritionnels & Nutri-Score</span>
          {activeCount !== undefined && totalCount !== undefined && (
            <span className="text-[11px] font-normal text-gray-400">
              ({activeCount} / {totalCount} plats affichés)
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#E85D2C] hover:text-[#D14C1E] font-bold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Réinitialiser</span>
          </button>
        )}
      </div>

      {/* Rangée des filtres pilules */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        {/* Filtre Nutri-Score */}
        <div className="flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E4E0] gap-1">
          <span className="text-[10px] font-bold text-gray-400 px-1.5 uppercase">Nutri-Score :</span>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, nutriScore: 'all' })}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filters.nutriScore === 'all'
                ? 'bg-[#1E1A18] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tous
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, nutriScore: 'AB' })}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              filters.nutriScore === 'AB'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            A/B Excellent
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, nutriScore: 'A' })}
            className={`px-2 py-1 rounded-lg text-xs font-black transition-all ${
              filters.nutriScore === 'A'
                ? 'bg-[#008B4C] text-white shadow-xs'
                : 'bg-emerald-50 text-[#008B4C] hover:bg-emerald-100'
            }`}
          >
            Score A
          </button>
        </div>

        {/* Filtre Max Calories */}
        <div className="flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E4E0] gap-1">
          <Flame className="w-3.5 h-3.5 text-[#E85D2C] ml-1" />
          <span className="text-[10px] font-bold text-gray-400 px-1 uppercase">Calories :</span>
          {[
            { id: 'all', label: 'Toutes' },
            { id: '500', label: '< 500 kcal' },
            { id: '800', label: '< 800 kcal' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange({ ...filters, maxCalories: item.id as any })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filters.maxCalories === item.id
                  ? 'bg-[#E85D2C] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Filtre Protéines */}
        <div className="flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E4E0] gap-1">
          <Zap className="w-3.5 h-3.5 text-blue-600 ml-1" />
          <span className="text-[10px] font-bold text-gray-400 px-1 uppercase">Protéines :</span>
          {[
            { id: 'all', label: 'Toutes' },
            { id: '15', label: '> 15g' },
            { id: '25', label: '> 25g High-Protein' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onFilterChange({ ...filters, minProtein: item.id as any })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filters.minProtein === item.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Filtre Sodium */}
        <button
          type="button"
          onClick={() => onFilterChange({ ...filters, lowSodiumOnly: !filters.lowSodiumOnly })}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
            filters.lowSodiumOnly
              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
              : 'bg-[#FAF8F5] text-gray-600 border-[#E8E4E0] hover:bg-gray-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-teal-500" />
          <span>Faible Sodium (Sel)</span>
        </button>
      </div>
    </div>
  );
};
