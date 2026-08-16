import React from 'react';
import {
  Leaf,
  Flame,
  Wheat,
  CheckCircle2,
  Sprout,
  TrendingDown,
  Dumbbell,
  AlertCircle,
  Tag,
} from 'lucide-react';

export interface TagConfig {
  bg: string;
  text: string;
  border: string;
  icon: React.ReactNode;
}

/**
 * Générateur de styles et d'icônes vectorielles colorées pour les tags diététiques (conforme à l'image de référence de l'utilisateur)
 */
export function getTagStyle(tag: string): TagConfig {
  const t = (tag || '').toLowerCase().trim();

  if (t.includes('végétarien') || t.includes('vegetarien')) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <Leaf className="w-3.5 h-3.5 text-emerald-600" />,
    };
  }
  if (t.includes('végétalien') || t.includes('vegan') || t.includes('végan')) {
    return {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: <Leaf className="w-3.5 h-3.5 text-emerald-600" />,
    };
  }
  if (t.includes('épicé') || t.includes('epice') || t.includes('spicy')) {
    return {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      icon: <Flame className="w-3.5 h-3.5 text-red-500" />,
    };
  }
  if (t.includes('gluten')) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: <Wheat className="w-3.5 h-3.5 text-amber-600" />,
    };
  }
  if (t.includes('halal')) {
    return {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />,
    };
  }
  if (t.includes('bio')) {
    return {
      bg: 'bg-lime-50',
      text: 'text-lime-800',
      border: 'border-lime-200',
      icon: <Sprout className="w-3.5 h-3.5 text-lime-600" />,
    };
  }
  if (t.includes('calorie')) {
    return {
      bg: 'bg-cyan-50',
      text: 'text-cyan-700',
      border: 'border-cyan-200',
      icon: <TrendingDown className="w-3.5 h-3.5 text-cyan-600" />,
    };
  }
  if (t.includes('protéine') || t.includes('proteine')) {
    return {
      bg: 'bg-pink-50',
      text: 'text-pink-700',
      border: 'border-pink-200',
      icon: <Dumbbell className="w-3.5 h-3.5 text-pink-600" />,
    };
  }
  if (t.includes('maison')) {
    return {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: <Flame className="w-3.5 h-3.5 text-orange-600" />,
    };
  }

  return {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: <Tag className="w-3.5 h-3.5 text-gray-500" />,
  };
}

/**
 * Générateur de styles pour les allergènes
 */
export function getAllergeneStyle(allergene: string): TagConfig {
  const a = (allergene || '').toLowerCase().trim();

  if (a.includes('gluten')) {
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: <AlertCircle className="w-3.5 h-3.5 text-red-600" /> };
  }
  if (a.includes('lactose') || a.includes('lait')) {
    return { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', icon: <AlertCircle className="w-3.5 h-3.5 text-yellow-600" /> };
  }
  if (a.includes('œuf') || a.includes('oeuf')) {
    return { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', icon: <AlertCircle className="w-3.5 h-3.5 text-orange-600" /> };
  }
  if (a.includes('poisson')) {
    return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', icon: <AlertCircle className="w-3.5 h-3.5 text-blue-600" /> };
  }
  if (a.includes('crustacé')) {
    return { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', icon: <AlertCircle className="w-3.5 h-3.5 text-indigo-600" /> };
  }
  if (a.includes('arachide') || a.includes('fruit à coque')) {
    return { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> };
  }
  if (a.includes('soja')) {
    return { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200', icon: <AlertCircle className="w-3.5 h-3.5 text-teal-600" /> };
  }

  return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> };
}
