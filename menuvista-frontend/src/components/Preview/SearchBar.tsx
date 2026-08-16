import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
}

/**
 * Barre de recherche vectorielle Enterprise SaaS avec Lucide Icons et 0 émoji
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Rechercher des éléments de menu...',
  resultCount,
  totalCount,
}) => {
  return (
    <div className="w-full space-y-1.5">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all shadow-2xs"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Effacer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {typeof resultCount === 'number' && (
        <div className="text-xs font-medium text-gray-500 px-1 flex justify-between items-center">
          {value.trim().length > 0 ? (
            <span>
              {resultCount === 0
                ? `Aucun résultat pour "${value}"`
                : `${resultCount} plat${resultCount > 1 ? 's' : ''} trouvé${resultCount > 1 ? 's' : ''}`}
            </span>
          ) : (
            <span>{totalCount ?? resultCount} plats disponibles</span>
          )}
        </div>
      )}
    </div>
  );
};
