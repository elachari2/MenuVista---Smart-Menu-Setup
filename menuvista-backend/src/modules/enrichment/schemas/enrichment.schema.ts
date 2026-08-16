import { z } from 'zod';

/**
 * Schéma Zod multilingue pour les textes (français, arabe, anglais).
 */
export const MultilingualTextSchema = z.object({
  fr: z.string().default(''),
  ar: z.string().default(''),
  en: z.string().default(''),
});

/**
 * Schéma Zod pour un plat enrichi individuel.
 */
export const DishEnrichmentItemSchema = z.object({
  platId: z.string().optional(),
  nomOriginal: z.string().optional(),
  nom: MultilingualTextSchema,
  description: MultilingualTextSchema,
  allergenes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

/**
 * Schéma Zod pour un lot (batch) de plats enrichis par l'IA Gemini.
 */
export const MenuEnrichmentBatchSchema = z.object({
  plats: z.array(DishEnrichmentItemSchema).default([]),
});

export type DishEnrichmentItemType = z.infer<typeof DishEnrichmentItemSchema>;
export type MenuEnrichmentBatchType = z.infer<typeof MenuEnrichmentBatchSchema>;
