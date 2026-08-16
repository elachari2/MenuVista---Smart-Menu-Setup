import React from 'react';
import {
  Wine,
  Coffee,
  GlassWater,
  Pizza,
  Beef,
  UtensilsCrossed,
  Fish,
  Cake,
  Salad,
  Flame,
  Utensils,
} from 'lucide-react';

export function getCategoryIcon(categoryName: string, className: string = 'w-4 h-4') {
  const cat = (categoryName || '').toLowerCase().trim();

  if (cat.includes('cocktail') || cat.includes('mocktail')) return <Wine className={className} />;
  if (cat.includes('café') || cat.includes('coffee') || cat.includes('thé')) return <Coffee className={className} />;
  if (cat.includes('boisson') || cat.includes('jus')) return <GlassWater className={className} />;
  if (cat.includes('pizza')) return <Pizza className={className} />;
  if (cat.includes('burger')) return <Beef className={className} />;
  if (cat.includes('viande') || cat.includes('grillade') || cat.includes('steak')) return <UtensilsCrossed className={className} />;
  if (cat.includes('poisson') || cat.includes('mer') || cat.includes('saumon')) return <Fish className={className} />;
  if (cat.includes('dessert') || cat.includes('pâtisserie') || cat.includes('gâteau')) return <Cake className={className} />;
  if (cat.includes('salade') || cat.includes('entrée')) return <Salad className={className} />;
  if (cat.includes('marocain') || cat.includes('tajine') || cat.includes('épice')) return <Flame className={className} />;

  return <Utensils className={className} />;
}
