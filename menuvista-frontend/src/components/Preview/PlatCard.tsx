import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Coffee, RefreshCw, Edit3, Copy, Trash2 } from 'lucide-react';
import { PlatPreview, MultilingualValue } from '../../types/menu.types';
import { getTagStyle, getAllergeneStyle } from '../../utils/tagStyleHelper';
import { NutritionCard } from '../Nutrition/NutritionCard';

interface PlatCardProps {
  plat: PlatPreview;
  categoryName?: string;
  langue?: 'fr' | 'ar' | 'en';
  onValidate?: (id: string) => void;
  onEdit?: (plat: PlatPreview) => void;
  onRematchImage?: (platId: string, newImageUrl: string) => void;
}

/**
 * Carte de plat avec conservation exacte de la devise et du prix du menu d'origine (0 hardcode)
 */
export function PlatCard({
  plat,
  categoryName = 'Plat',
  langue = 'fr',
  onEdit,
  onRematchImage,
}: PlatCardProps) {
  const [currentImage, setCurrentImage] = useState<string | null>(plat.imageUrl || null);
  const [isRematching, setIsRematching] = useState(false);

  const getMultilingualText = (textObj: MultilingualValue | null | undefined): string => {
    if (!textObj) return '';
    if (typeof textObj === 'string') return textObj;
    return textObj[langue] || textObj.fr || textObj.en || textObj.ar || '';
  };

  const nom = getMultilingualText(plat.nom) || 'Nom inconnu';
  const description = getMultilingualText(plat.description);

  /**
   * Formattage universel respectant scrupuleusement la DEVISE EXACTE présente sur le menu ($ , USD , DH , dhs , MAD , € , EUR , AED , LIRA...)
   */
  const formatPrice = (price?: number | string | null, currency?: string | null): string => {
    if (price === undefined || price === null) return '';
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) return '';

    const rawCurr = (currency || 'DH').trim();
    const u = rawCurr.toUpperCase();

    if (rawCurr === '$' || u === 'USD' || u === 'DOLLAR') {
      return `$${numPrice}`;
    }
    if (rawCurr === '€' || u === 'EUR' || u === 'EURO') {
      return `${numPrice} €`;
    }
    if (rawCurr === '£' || u === 'GBP') {
      return `£${numPrice}`;
    }
    if (u === 'DH' || rawCurr.toLowerCase() === 'dhs' || u === 'MAD' || rawCurr === 'د.م.') {
      return `${numPrice} DH`;
    }
    if (u === 'AED') return `${numPrice} AED`;
    if (u === 'LIRA' || u === 'TL' || rawCurr === '₺') return `${numPrice} LIRA`;

    return `${numPrice} ${rawCurr}`;
  };

  const handleRematch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRematching(true);
    try {
      const response = await fetch(`http://localhost:3000/api/v1/admin/plat/${plat.id}/re-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, categorie: categoryName, tags: plat.tags || [] }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          setCurrentImage(data.imageUrl);
          onRematchImage?.(plat.id, data.imageUrl);
        }
      }
    } catch (err) {
      console.error('Erreur réassociation d\'image:', err);
    } finally {
      setIsRematching(false);
    }
  };

  const defaultGastronomicPhoto = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80';
  const imageUrl = currentImage
    ? currentImage.startsWith('http')
      ? currentImage
      : `http://localhost:3000${currentImage}`
    : defaultGastronomicPhoto;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 8px 25px rgba(0,0,0,0.08)' }}
      className="bg-white rounded-2xl border border-[#E8E4E0] overflow-hidden hover:border-[#E85D2C] transition-all flex flex-col justify-between"
    >
      <div className="flex gap-4 p-4">
        {/* Image HD avec Lucide Icon fallback */}
        <div className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-100 group border border-gray-100 flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={nom}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = defaultGastronomicPhoto;
              }}
            />
          ) : (
            <Coffee className="w-8 h-8 text-gray-400" />
          )}

          {/* Bouton de réassociation d'image */}
          <button
            type="button"
            onClick={handleRematch}
            disabled={isRematching}
            className="absolute bottom-1 left-1 right-1 bg-black/70 hover:bg-[#E85D2C] text-white text-[9px] font-semibold py-0.5 rounded-sm backdrop-blur-xs flex items-center justify-center gap-1 transition-colors"
            title="Réassocier une image"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isRematching ? 'animate-spin' : ''}`} />
            <span>Visuel</span>
          </button>
        </div>

        {/* Informations du plat */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-extrabold text-[#1E1A18] truncate text-base">
                {nom}
              </h3>
              {plat.prix && Number(plat.prix) > 0 ? (
                <span className="font-extrabold text-[#E85D2C] whitespace-nowrap text-base">
                  {formatPrice(plat.prix, plat.devise)}
                </span>
              ) : (
                <span className="text-[11px] font-medium text-gray-400 italic bg-gray-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                  Sur demande
                </span>
              )}
            </div>



            <p className="text-sm text-[#5A554F] line-clamp-2 mt-1 leading-relaxed">
              {description || 'Aucune description'}
            </p>
          </div>

          {/* Badges Tags & Allergènes ULTRA-COLORÉS */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {plat.tags?.slice(0, 4).map((tag: string) => {
              const style = getTagStyle(tag);
              return (
                <span
                  key={tag}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${style.bg} ${style.text} ${style.border}`}
                >
                  {style.icon}
                  <span>{tag}</span>
                </span>
              );
            })}

            {plat.allergenes?.slice(0, 3).map((a: string) => {
              const style = getAllergeneStyle(a);
              return (
                <span
                  key={a}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${style.bg} ${style.text} ${style.border}`}
                >
                  {style.icon}
                  <span>{a}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Estimation Nutritionnelle Locale SN-05 */}
      <div className="px-4 pb-3">
        <NutritionCard dishName={nom} categoryName={categoryName} dishId={plat.id} />
      </div>

      {/* Barre d'Action Inférieure */}
      <div className="px-4 py-2 bg-gray-50/70 border-t border-[#E8E4E0] flex items-center justify-between text-xs text-gray-500">
        <span className="text-[11px] font-semibold text-[#5A554F]">{categoryName}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onEdit?.(plat)}
            className="hover:text-[#E85D2C] font-semibold transition-colors flex items-center gap-1 text-[#1E1A18]"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#E85D2C]" />
            <span>Modifier</span>
          </button>
          <button
            type="button"
            className="hover:text-[#1E1A18] transition-colors p-1"
            title="Dupliquer"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="hover:text-red-600 transition-colors p-1"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
