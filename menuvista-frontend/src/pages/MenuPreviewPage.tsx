import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Layout/Header';
import { Footer } from '../components/Layout/Footer';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { AlertBanner } from '../components/UI/AlertBanner';
import { LoadingSkeleton } from '../components/UI/LoadingSkeleton';
import { SearchBar } from '../components/Preview/SearchBar';
import { LanguageSelector } from '../components/Preview/LanguageSelector';
import { CategorySection } from '../components/Preview/CategorySection';
import { StatsGrid } from '../components/Stats/StatsGrid';
import { EditPlatModal } from '../components/Preview/EditPlatModal';
import { useMenuPreview } from '../hooks/useMenuPreview';
import { PlatPreview, MenuPreview } from '../types/menu.types';
import { ShieldAlert, ArrowLeft, Download, Printer } from 'lucide-react';
import { NutritionFilters, NutritionFilterState } from '../components/Nutrition/NutritionFilters';

/**
 * Page de prévisualisation officielle MenuVista avec suppression de l'en-tête en double et ajout d'allergène silencieux (sans popups alert)
 */
export const MenuPreviewPage: React.FC = () => {
  const { menuId } = useParams<{ menuId: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState<'fr' | 'ar' | 'en'>('fr');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  // Filtres Nutritionnels SN-05
  const [nutritionFilters, setNutritionFilters] = useState<NutritionFilterState>({
    nutriScore: 'all',
    maxCalories: 'all',
    minProtein: 'all',
    lowSodiumOnly: false,
  });

  // Mode Allergènes Admin Toggle
  const [isAllergeneModeActive, setIsAllergeneModeActive] = useState(false);
  const [newAllergeneInput, setNewAllergeneInput] = useState('');
  const [customAllergenesList, setCustomAllergenesList] = useState<string[]>([]);

  // Équipement d'édition du plat (Modal)
  const [editingPlat, setEditingPlat] = useState<PlatPreview | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: initialMenu, isLoading, isError, error, refetch } = useMenuPreview(menuId || '');
  const [localMenuData, setLocalMenuData] = useState<MenuPreview | null>(null);

  React.useEffect(() => {
    if (initialMenu) {
      setLocalMenuData(initialMenu);
    }
  }, [initialMenu]);

  const activeMenu = localMenuData || initialMenu;

  // Calcul des statistiques globales
  const stats = useMemo(() => {
    if (!activeMenu || !activeMenu.categories) {
      return { totalCategories: 0, totalPlats: 0, avgPrice: '0.00', unpricedCount: 0, defaultCurrency: 'MAD', totalEnrichis: 0 };
    }

    let totalCategories = activeMenu.categories.length;
    let totalPlats = 0;
    let totalPriceSum = 0;
    let countPriced = 0;
    let unpricedCount = 0;
    let totalEnrichis = 0;

    activeMenu.categories.forEach((cat) => {
      cat.plats.forEach((plat) => {
        totalPlats++;
        if (plat.description) {
          totalEnrichis++;
        }
        if (plat.prix && plat.prix > 0) {
          totalPriceSum += Number(plat.prix);
          countPriced++;
        } else {
          unpricedCount++;
        }
      });
    });

    const avgPrice = countPriced > 0 ? (totalPriceSum / countPriced).toFixed(2) : '0.00';
    const defaultCurrency = activeMenu.categories[0]?.plats[0]?.devise || 'MAD';

    return { totalCategories, totalPlats, avgPrice, unpricedCount, defaultCurrency, totalEnrichis };
  }, [activeMenu]);

  // Liste des catégories pour les pilules horizontales
  const categoryNamesList = useMemo(() => {
    if (!activeMenu || !activeMenu.categories) return [];
    return activeMenu.categories.map((cat) => {
      if (typeof cat.nom === 'string') return cat.nom;
      return cat.nom[selectedLang] || cat.nom.fr || 'Catégorie';
    });
  }, [activeMenu, selectedLang]);

  // Ajouter un nouvel allergène système (Admin) silencieusement en backend/mémoire SANS AUCUN POPUP ALERT
  const handleAddCustomAllergene = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergeneInput.trim()) return;
    const cleanAllergene = newAllergeneInput.trim();
    if (!customAllergenesList.includes(cleanAllergene)) {
      setCustomAllergenesList([...customAllergenesList, cleanAllergene]);
      // Enregistrement silencieux en backend / mémoire sans aucun message popup alert
    }
    setNewAllergeneInput('');
  };

  const handleOpenEditModal = (plat: PlatPreview) => {
    setEditingPlat(plat);
    setIsEditModalOpen(true);
  };

  const handleSavePlatChanges = (updatedPlat: PlatPreview) => {
    if (!activeMenu) return;

    const newCategories = activeMenu.categories.map((cat) => ({
      ...cat,
      plats: cat.plats.map((p) => (p.id === updatedPlat.id ? updatedPlat : p)),
    }));

    setLocalMenuData({
      ...activeMenu,
      categories: newCategories,
    });
  };

  // Filtrage par recherche et catégorie
  const filteredCategories = useMemo(() => {
    if (!activeMenu || !activeMenu.categories) return [];

    const query = searchQuery.trim().toLowerCase();

    return activeMenu.categories
      .map((cat) => {
        const catNameStr = typeof cat.nom === 'string' ? cat.nom : cat.nom[selectedLang] || cat.nom.fr || '';
        const isCatMatch = activeCategoryFilter === 'all' || catNameStr.toLowerCase() === activeCategoryFilter.toLowerCase();

        const filteredPlats = cat.plats.filter((plat) => {
          const platName = typeof plat.nom === 'string' ? plat.nom : plat.nom[selectedLang] || plat.nom.fr || '';
          const platDesc = typeof plat.description === 'string' ? plat.description : plat.description?.[selectedLang] || plat.description?.fr || '';

          const matchesQuery = query === '' || platName.toLowerCase().includes(query) || platDesc.toLowerCase().includes(query);

          return isCatMatch && matchesQuery;
        });

        return {
          ...cat,
          plats: filteredPlats,
        };
      })
      .filter((cat) => cat.plats.length > 0);
  }, [activeMenu, searchQuery, selectedLang, activeCategoryFilter]);

  const filteredPlatsCount = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.plats.length, 0);
  }, [filteredCategories]);

  // Exporter JSON
  const handleExportJson = () => {
    if (!activeMenu) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeMenu, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `menu_${activeMenu.menuId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF8F6] text-[#1E1A18] font-sans">
      <div>
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* ÉTAT DE CHARGEMENT SKELETON */}
          {isLoading && (
            <div className="space-y-6">
              <Card className="p-6 bg-white rounded-2xl">
                <LoadingSkeleton />
              </Card>
            </div>
          )}

          {/* ÉTAT D'ERREUR */}
          {isError && (
            <Card className="p-6 bg-white rounded-2xl">
              <AlertBanner
                title="Erreur de Chargement"
                message={error?.message || 'Impossible de charger la prévisualisation du menu.'}
                onRetry={() => refetch()}
                retryLabel="Recharger"
              />
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={() => navigate('/')} className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour à l'accueil</span>
                </Button>
              </div>
            </Card>
          )}

          {/* CONTENU PRINCIPAL DU MENU */}
          {activeMenu && !isLoading && (
            <div className="space-y-6">
              {/* Grille de Statistiques (StatsGrid.tsx) */}
              <StatsGrid
                categoriesCount={stats.totalCategories}
                platsCount={stats.totalPlats}
                prixMoyen={stats.avgPrice}
                enrichisCount={stats.totalEnrichis}
                currency={stats.defaultCurrency}
              />

              {/* Barre des Outils & Filtres */}
              <div className="bg-white rounded-2xl p-4 border border-[#E8E4E0] shadow-2xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Recherche Vectorielle */}
                  <div className="w-full lg:w-80">
                    <SearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Rechercher des éléments de menu..."
                      resultCount={filteredPlatsCount}
                      totalCount={stats.totalPlats}
                    />
                  </div>

                  {/* Sélecteur de Langue & Contrôles */}
                  <div className="flex flex-wrap items-center gap-3">
                    <LanguageSelector
                      currentLang={selectedLang}
                      onLanguageChange={setSelectedLang}
                    />

                    <button
                      type="button"
                      onClick={() => setIsAllergeneModeActive(!isAllergeneModeActive)}
                      className={`text-xs py-2 px-3.5 font-bold rounded-xl transition-all border flex items-center gap-1.5 ${
                        isAllergeneModeActive
                          ? 'bg-[#FDF0EB] text-[#E85D2C] border-[#E85D2C]'
                          : 'bg-white text-[#1E1A18] border-[#E8E4E0] hover:border-[#E85D2C]'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 text-[#E85D2C]" />
                      <span>Mode Allergènes {isAllergeneModeActive ? '(Actif)' : ''}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="p-2 text-[#5A554F] hover:text-[#1E1A18] border border-[#E8E4E0] rounded-xl hover:bg-gray-50 transition-colors"
                      title="Exporter JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="p-2 text-[#5A554F] hover:text-[#1E1A18] border border-[#E8E4E0] rounded-xl hover:bg-gray-50 transition-colors"
                      title="Imprimer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Navigation par Pilules de Catégories Horizontales (Orange Accent #E85D2C) */}
                <div className="pt-3 border-t border-[#E8E4E0] flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveCategoryFilter('all')}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      activeCategoryFilter === 'all'
                        ? 'bg-[#E85D2C] text-white shadow-xs'
                        : 'bg-white text-[#5A554F] border border-[#E8E4E0] hover:bg-gray-50'
                    }`}
                  >
                    Tout ({stats.totalPlats})
                  </button>

                  {categoryNamesList.map((catName, idx) => (
                    <button
                      key={`cat-pill-${idx}`}
                      type="button"
                      onClick={() => setActiveCategoryFilter(catName)}
                      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        activeCategoryFilter.toLowerCase() === catName.toLowerCase()
                          ? 'bg-[#E85D2C] text-white shadow-xs'
                          : 'bg-white text-[#5A554F] border border-[#E8E4E0] hover:bg-gray-50'
                      }`}
                    >
                      {catName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barre de Filtres Nutritionnels SN-05 */}
              <NutritionFilters
                filters={nutritionFilters}
                onFilterChange={setNutritionFilters}
                activeCount={filteredPlatsCount}
                totalCount={stats.totalPlats}
              />

              {/* Mode Allergènes Système Admin Input (Silencieux sans aucun popup alert) */}
              {isAllergeneModeActive && (
                <div className="bg-[#FFFDF9] rounded-2xl p-5 border border-[#FADBD8] shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 text-[#E85D2C] font-extrabold text-sm">
                    <ShieldAlert className="w-4 h-4 text-[#E85D2C]" />
                    <span>Gestion des allergènes système (Admin)</span>
                  </div>
                  <p className="text-xs text-[#5A554F]">
                    Créez de nouveaux allergènes personnalisés ci-dessous pour les ajouter au registre global du menu.
                  </p>

                  <form onSubmit={handleAddCustomAllergene} className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      value={newAllergeneInput}
                      onChange={(e) => setNewAllergeneInput(e.target.value)}
                      placeholder="Nom de l'allergène (ex: Sésame, Sulfites, Lupin...)"
                      className="flex-1 px-4 py-2 bg-white border border-[#E8E4E0] rounded-xl text-xs text-[#1E1A18] focus:border-[#E85D2C] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-[#E85D2C] hover:bg-[#D14C1E] text-white text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap"
                    >
                      + Ajouter l'allergène
                    </button>
                  </form>
                </div>
              )}

              {/* Conteneur des Catégories et Plats */}
              <div>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <CategorySection
                      key={cat.id}
                      category={cat}
                      lang={selectedLang}
                      onEditPlat={handleOpenEditModal}
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center border border-[#E8E4E0]">
                    <p className="text-base font-bold text-[#1E1A18]">
                      Aucun plat ne correspond à vos critères de recherche.
                    </p>
                    <p className="text-xs text-[#5A554F] mt-1">
                      Réinitialisez la recherche textuelle ou sélectionnez une autre catégorie.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategoryFilter('all');
                      }}
                      className="mt-4 px-4 py-2 text-xs font-bold text-[#E85D2C] border border-[#FADBD8] rounded-xl hover:bg-[#FDF0EB] transition-colors"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal d'Édition */}
      <EditPlatModal
        plat={editingPlat}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSavePlatChanges}
        customAllergenes={customAllergenesList}
      />

      <Footer />
    </div>
  );
};
