import React from 'react';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  currentLang: 'fr' | 'ar' | 'en';
  onLanguageChange: (lang: 'fr' | 'ar' | 'en') => void;
}

/**
 * Sélecteur de langue vectoriel Enterprise SaaS avec Lucide Icons et 0 émoji
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLang,
  onLanguageChange,
}) => {
  return (
    <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-1 text-xs shadow-2xs">
      <Globe className="w-3.5 h-3.5 text-gray-400 ml-1.5" />
      <span className="text-gray-500 font-medium hidden sm:inline">Langue :</span>
      <button
        type="button"
        onClick={() => onLanguageChange('fr')}
        className={`px-2.5 py-1 rounded-md font-semibold transition-all duration-150 ${
          currentLang === 'fr'
            ? 'bg-primary-600 text-white shadow-2xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        Français
      </button>
      <button
        type="button"
        onClick={() => onLanguageChange('ar')}
        className={`px-2.5 py-1 rounded-md font-semibold transition-all duration-150 ${
          currentLang === 'ar'
            ? 'bg-primary-600 text-white shadow-2xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        العربية
      </button>
      <button
        type="button"
        onClick={() => onLanguageChange('en')}
        className={`px-2.5 py-1 rounded-md font-semibold transition-all duration-150 ${
          currentLang === 'en'
            ? 'bg-primary-600 text-white shadow-2xs'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        English
      </button>
    </div>
  );
};
