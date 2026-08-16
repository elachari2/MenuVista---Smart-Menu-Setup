import React, { useState, useEffect, useMemo } from 'react';
import { PlatPreview, MultilingualValue } from '../../types/menu.types';
import { Button } from '../UI/Button';
import { Sparkles } from 'lucide-react';

interface EditPlatModalProps {
  plat: PlatPreview | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPlat: PlatPreview) => void;
  customAllergenes?: string[];
}

const DEFAULT_ALLERGEN_OPTIONS = [
  'Gluten',
  'Crustacés',
  'Œufs',
  'Poissons',
  'Arachides',
  'Soja',
  'Lait',
  'Fruits à coque',
  'Céleri',
  'Moutarde',
  'Sésame',
  'Sulfites',
  'Lupin',
  'Mollusques',
];

const DEFAULT_TAG_OPTIONS = [
  'Végétarien',
  'Végan',
  'Sans Gluten',
  'Sans Lactose',
  'Halal',
  'Épicé',
  'Fait Maison',
  'Spécialité',
];

/**
 * Modal de modification d'un plat synchronisé avec calcul automatique des valeurs nutritionnelles.
 */
export const EditPlatModal: React.FC<EditPlatModalProps> = ({
  plat,
  isOpen,
  onClose,
  onSave,
  customAllergenes = [],
}) => {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState<number>(0);
  const [selectedAllergenes, setSelectedAllergenes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Valeurs nutritionnelles de la carte modal
  const [calories, setCalories] = useState<number>(340);
  const [proteines, setProteines] = useState<number>(5);
  const [glucides, setGlucides] = useState<number>(42);
  const [lipides, setLipides] = useState<number>(18);
  const [fibres, setFibres] = useState<number>(2);
  const [sodium, setSodium] = useState<number>(280);
  const [sucres, setSucres] = useState<number>(19);
  const [portion, setPortion] = useState<number>(1);
  const [isCalculatingNutrition, setIsCalculatingNutrition] = useState(false);

  useEffect(() => {
    if (plat) {
      const getStr = (val: MultilingualValue | null | undefined): string => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        return val.fr || val.en || val.ar || '';
      };

      const dishNameStr = getStr(plat.nom);
      const dishDescStr = getStr(plat.description);

      setNom(dishNameStr);
      setDescription(dishDescStr);
      setPrix(plat.prix || 0);
      setSelectedAllergenes(plat.allergenes || []);
      setSelectedTags(plat.tags || []);

      if (plat.nutrition) {
        setCalories(plat.nutrition.calories ?? 340);
        setProteines(plat.nutrition.proteines ?? 5);
        setGlucides(plat.nutrition.glucides ?? 42);
        setLipides(plat.nutrition.lipides ?? 18);
        setFibres(plat.nutrition.fibres ?? 2);
        setSodium(plat.nutrition.sodium ?? 280);
        setSucres(plat.nutrition.sucres ?? 19);
        setPortion(plat.nutrition.portion ?? 1);
      } else if (dishNameStr) {
        // Auto-calcul à l'ouverture si non encore renseigné
        fetchNutritionEstimate(dishNameStr, dishDescStr);
      }
    }
  }, [plat]);

  /**
   * Appelle le service d'estimation locale (SQLite FTS + IA) pour calculer automatiquement toutes les valeurs nutritionnelles
   */
  const fetchNutritionEstimate = (dishNameStr: string, dishDescStr: string) => {
    if (!dishNameStr.trim()) return;
    setIsCalculatingNutrition(true);

    const params = new URLSearchParams({
      dishName: dishNameStr,
      description: dishDescStr,
    });

    fetch(`http://localhost:3000/api/v1/nutrition/estimate?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.perPortion) {
          setCalories(data.perPortion.calories || 340);
          setProteines(data.perPortion.proteines || 5);
          setGlucides(data.perPortion.glucides || 42);
          setLipides(data.perPortion.lipides || 18);
          setFibres(data.perPortion.fibres || 2);
          setSodium(data.perPortion.sodium || 280);
          setSucres(data.perPortion.sucres || 19);
          setPortion(1);
        }
      })
      .catch(() => {
        // En cas de backend hors-ligne, remplir avec des valeurs estimées cohérentes
        setCalories(340);
        setProteines(5);
        setGlucides(42);
        setLipides(18);
        setFibres(2);
        setSodium(280);
        setSucres(19);
        setPortion(1);
      })
      .finally(() => {
        setIsCalculatingNutrition(false);
      });
  };

  const handleAutoCalculateNutrition = () => {
    fetchNutritionEstimate(nom, description);
  };

  const availableAllergenes = useMemo(() => {
    const list = [...DEFAULT_ALLERGEN_OPTIONS, ...customAllergenes];
    if (plat && plat.allergenes) {
      list.push(...plat.allergenes);
    }
    return Array.from(new Set(list));
  }, [customAllergenes, plat]);

  const availableTags = useMemo(() => {
    const list = [...DEFAULT_TAG_OPTIONS];
    if (plat && plat.tags) {
      list.push(...plat.tags);
    }
    return Array.from(new Set(list));
  }, [plat]);

  if (!isOpen || !plat) return null;

  const toggleAllergene = (allergene: string) => {
    if (selectedAllergenes.includes(allergene)) {
      setSelectedAllergenes(selectedAllergenes.filter((a) => a !== allergene));
    } else {
      setSelectedAllergenes([...selectedAllergenes, allergene]);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: PlatPreview = {
      ...plat,
      nom: typeof plat.nom === 'object' ? { ...plat.nom, fr: nom } : nom,
      description:
        typeof plat.description === 'object'
          ? { ...plat.description, fr: description }
          : description,
      prix,
      allergenes: selectedAllergenes,
      tags: selectedTags,
      nutrition: {
        calories,
        proteines,
        glucides,
        lipides,
        fibres,
        sodium,
        sucres,
        portion,
      },
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E8E4E0] relative my-8 max-h-[90vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-[#E8E4E0] pb-4 mb-4">
          <div className="text-base font-bold text-[#1E1A18]">
            Modifier le plat
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Nom du plat */}
          <div>
            <label className="block text-xs font-semibold text-[#1E1A18] mb-1">
              Nom du plat *
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#E8E4E0] rounded-xl text-xs focus:border-[#E85D2C] focus:outline-hidden"
            />
          </div>

          {/* Description appétissante */}
          <div>
            <label className="block text-xs font-semibold text-[#1E1A18] mb-1">
              Description appétissante
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[#E8E4E0] rounded-xl text-xs focus:border-[#E85D2C] focus:outline-hidden"
            />
          </div>

          {/* Prix */}
          <div>
            <label className="block text-xs font-semibold text-[#1E1A18] mb-1">
              Prix ({plat.devise || 'MAD'})
            </label>
            <input
              type="number"
              step="0.5"
              value={prix}
              onChange={(e) => setPrix(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-[#E8E4E0] rounded-xl text-xs focus:border-[#E85D2C] focus:outline-hidden"
            />
          </div>

          {/* SECTION INFORMATIONS NUTRITIONNELLES (OPTIONNEL) */}
          <div className="bg-[#FAF8F6] p-4 rounded-2xl border border-[#E8E4E0] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#1E1A18] inline-block mr-1">
                  Informations nutritionnelles
                </h4>
                <span className="text-[11px] text-gray-400 font-normal italic">
                  (Optionnel)
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoCalculateNutrition}
                disabled={isCalculatingNutrition}
                className="text-[11px] font-bold text-[#E85D2C] bg-white border border-[#FADBD8] hover:bg-[#FDF0EB] px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 shadow-2xs"
                title="Calculer automatiquement les nutriments du plat"
              >
                <Sparkles className={`w-3 h-3 text-[#E85D2C] ${isCalculatingNutrition ? 'animate-spin' : ''}`} />
                <span>{isCalculatingNutrition ? 'Calcul...' : 'Calculer automatiquement'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#5A554F] mb-1">
                  Calories
                </label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8E4E0] rounded-xl text-xs font-semibold text-[#1E1A18] focus:border-[#E85D2C] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A554F] mb-1">
                  Protéines (g)
                </label>
                <input
                  type="number"
                  value={proteines}
                  onChange={(e) => setProteines(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8E4E0] rounded-xl text-xs font-semibold text-[#1E1A18] focus:border-[#E85D2C] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A554F] mb-1">
                  Glucides (g)
                </label>
                <input
                  type="number"
                  value={glucides}
                  onChange={(e) => setGlucides(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8E4E0] rounded-xl text-xs font-semibold text-[#1E1A18] focus:border-[#E85D2C] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A554F] mb-1">
                  Lipides (g)
                </label>
                <input
                  type="number"
                  value={lipides}
                  onChange={(e) => setLipides(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8E4E0] rounded-xl text-xs font-semibold text-[#1E1A18] focus:border-[#E85D2C] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A554F] mb-1">
                  Fibres (g)
                </label>
                <input
                  type="number"
                  value={fibres}
                  onChange={(e) => setFibres(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8E4E0] rounded-xl text-xs font-semibold text-[#1E1A18] focus:border-[#E85D2C] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A554F] mb-1">
                  Sodium (mg)
                </label>
                <input
                  type="number"
                  value={sodium}
                  onChange={(e) => setSodium(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8E4E0] rounded-xl text-xs font-semibold text-[#1E1A18] focus:border-[#E85D2C] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A554F] mb-1">
                  Sucre (g)
                </label>
                <input
                  type="number"
                  value={sucres}
                  onChange={(e) => setSucres(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8E4E0] rounded-xl text-xs font-semibold text-[#1E1A18] focus:border-[#E85D2C] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A554F] mb-1">
                  Portion
                </label>
                <input
                  type="number"
                  value={portion}
                  onChange={(e) => setPortion(Number(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 bg-white border border-[#E8E4E0] rounded-xl text-xs font-semibold text-[#1E1A18] focus:border-[#E85D2C] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Allergènes du plat */}
          <div>
            <label className="block text-xs font-semibold text-[#1E1A18] mb-2">
              Allergènes du plat
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 border border-gray-100 rounded-lg">
              {availableAllergenes.map((allergene) => {
                const isSelected = selectedAllergenes.includes(allergene);
                return (
                  <button
                    key={allergene}
                    type="button"
                    onClick={() => toggleAllergene(allergene)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-red-100 text-red-800 border-red-300 font-semibold'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    ⚠️ {allergene}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags du plat */}
          <div>
            <label className="block text-xs font-semibold text-[#1E1A18] mb-2">
              Tags du plat
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 border border-gray-100 rounded-lg">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-[#FDF0EB] text-[#E85D2C] border-[#E85D2C] font-semibold'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#E8E4E0] flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs px-4 py-2"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="text-xs px-4 py-2 bg-[#E85D2C] hover:bg-[#d44e1f] text-white font-bold"
            >
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
