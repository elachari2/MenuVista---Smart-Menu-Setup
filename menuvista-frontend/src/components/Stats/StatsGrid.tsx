import React from 'react';
import { FolderKanban, Utensils, Coins } from 'lucide-react';
import { StatCard } from './StatCard';

interface StatsGridProps {
  categoriesCount: number;
  platsCount: number;
  prixMoyen: string;
  enrichisCount?: number;
  currency?: string;
}

/**
 * Grille de 3 cartes statistiques clés (Catégories, Total Plats, Prix Moyen)
 */
export function StatsGrid({
  categoriesCount,
  platsCount,
  prixMoyen,
  currency = 'USD',
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        icon={<FolderKanban className="w-5 h-5 text-[#E85D2C]" />}
        label="Catégories"
        value={categoriesCount}
        subtitle="Sections structurées"
      />
      <StatCard
        icon={<Utensils className="w-5 h-5 text-[#E85D2C]" />}
        label="Total Plats"
        value={platsCount}
        subtitle="Éléments au menu"
      />
      <StatCard
        icon={<Coins className="w-5 h-5 text-[#E85D2C]" />}
        label="Prix Moyen"
        value={currency === 'USD' || currency === '$' ? `$${prixMoyen}` : `${prixMoyen} ${currency}`}
        subtitle="Calculé automatiquement"
      />
    </div>
  );
}
