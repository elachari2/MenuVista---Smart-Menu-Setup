import React, { useState } from 'react';
import { CategoryPreview, MultilingualValue, PlatPreview } from '../../types/menu.types';
import { PlatCard } from './PlatCard';
import { getCategoryIcon } from '../../utils/categoryIcons';
import { ChevronDown } from 'lucide-react';

interface CategorySectionProps {
  category: CategoryPreview;
  lang?: 'fr' | 'ar' | 'en';
  onValidatePlat?: (id: string) => void;
  onEditPlat?: (plat: PlatPreview) => void;
}

/**
 * Section de catégorie avec l'icône vectorielle Lucide et le badge Orange #E85D2C
 */
export const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  lang = 'fr',
  onValidatePlat,
  onEditPlat,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getCategoryName = (textObj: MultilingualValue): string => {
    if (typeof textObj === 'string') return textObj;
    return textObj[lang] || textObj.fr || textObj.en || textObj.ar || 'Catégorie';
  };

  const categoryName = getCategoryName(category.nom);

  if (!category.plats || category.plats.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 bg-white rounded-2xl border border-[#E8E4E0] shadow-2xs overflow-hidden">
      {/* En-tête de catégorie accordéon vectoriel */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors border-b border-[#E8E4E0]"
      >
        <h3 className="text-base font-extrabold text-[#1E1A18] uppercase tracking-wide flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#FDF0EB] text-[#E85D2C] border border-[#FADBD8]">
            {getCategoryIcon(categoryName, 'w-4 h-4')}
          </div>
          <span>{categoryName}</span>
        </h3>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#E85D2C] bg-[#FDF0EB] px-3 py-1 rounded-full border border-[#FADBD8]">
            {category.plats.length} plat{category.plats.length > 1 ? 's' : ''}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Grille responsive 2 colonnes */}
      {isExpanded && (
        <div className="p-4 bg-[#FAF8F6]/50 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {category.plats.map((plat) => (
            <PlatCard
              key={plat.id}
              plat={plat}
              categoryName={categoryName}
              langue={lang}
              onValidate={onValidatePlat}
              onEdit={onEditPlat}
            />
          ))}
        </div>
      )}
    </div>
  );
};
