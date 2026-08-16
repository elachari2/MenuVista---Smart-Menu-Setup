import { z } from 'zod';

/** Type flexible pour les textes multilingues ou simples */
const StringOrMultilingualSchema = z.union([
  z.string(),
  z.object({
    fr: z.string().optional(),
    ar: z.string().optional(),
    en: z.string().optional(),
  }),
]);

/** Transformateur universel de prix (gère nombres et chaînes ex: "90", "90.50 MAD", "12€") */
const PriceSchema = z.preprocess((val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '.').replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}, z.number().nullable().optional());

/** Schéma de validation d'un plat extrait avec détection universelle des devises */
export const PlatVisionSchema = z.object({
  nom: StringOrMultilingualSchema,
  description: StringOrMultilingualSchema.nullable().optional(),
  prix: PriceSchema,
  devise: z.string().nullable().optional(),
  unite: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  allergenes: z.array(z.string()).nullable().optional(),
  prix_incertain: z.boolean().optional(),
  nom_incertain: z.boolean().optional(),
});

/** Schéma de validation d'une catégorie de menu */
export const CategorieVisionSchema = z.object({
  nom: StringOrMultilingualSchema,
  plats: z.array(PlatVisionSchema),
});

/** Schéma de validation complet pour l'extraction de menu */
export const UnifiedMenuExtractionSchema = z.object({
  devise: z.string().nullable().optional(),
  categories: z.array(CategorieVisionSchema),
  statistiques: z
    .object({
      total_categories: z.number().optional(),
      total_plats: z.number().optional(),
      plats_sans_prix: z.number().optional(),
    })
    .optional(),
});

/** Type TypeScript inféré du schéma Zod */
export type UnifiedMenuExtractionType = z.infer<typeof UnifiedMenuExtractionSchema>;
export type CategorieVisionType = z.infer<typeof CategorieVisionSchema>;
export type PlatVisionType = z.infer<typeof PlatVisionSchema>;
