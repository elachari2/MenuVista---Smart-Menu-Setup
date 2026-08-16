export interface InputDishForEnrichment {
  platId: string;
  nom: string;
  categorie: string;
  descriptionExistante?: string | null;
  prix?: number;
  devise?: string;
}

/**
 * Construit le prompt de génération d'enrichissements culinaires et traductions spécialement optimisé pour DeepSeek.
 * @param dishes Lot de 5 plats maximum à enrichir
 */
export const BUILD_BATCH_ENRICHMENT_PROMPT = (dishes: InputDishForEnrichment[]): string => {
  const dishesFormatted = dishes
    .map(
      (d, index) =>
        `PLAT N°${index + 1} (ID: ${d.platId}):\n- Nom: "${d.nom}"\n- Catégorie: "${d.categorie}"\n- Ingrédients / Description brute: "${d.descriptionExistante || 'Aucune'}"\n- Prix: ${d.prix || 0} ${d.devise || 'MAD'}`,
    )
    .join('\n\n');

  return `
Tu es un chef cuisinier gastronomique expert en rédaction de menus pour l'API DeepSeek.

Voici un lot de ${dishes.length} plat(s) à enrichir :

${dishesFormatted}

---

**RÈGLES STRICTES DE DEEPSEEK POUR LA DESCRIPTION CULINAIRE :**

1. La description doit être UNIQUE, GOURMANDE et SPÉCIFIQUE à chaque plat.
2. Mentionne AU MOINS 2 ingrédients clés ou modes de préparation (ex: mariné, gratiné, poêlé).
3. Évoque la texture, l'arôme ou l'équilibre des saveurs (1-2 phrases).
4. **NE PAS utiliser de phrases génériques banales** comme "Délicieux plat", "Savoureux", "Préparé avec soin", "Plat traditionnel".
5. Fournis la traduction parfaite en 3 langues : Français (\`fr\`), Arabe (\`ar\`), Anglais (\`en\`).

**EXEMPLES DE BONNE DESCRIPTION :**
- ✅ "Un cocktail rafraîchissant à la menthe fraîche, citron vert et rhum cubain, servi avec de la glace pilée."
- ❌ "Un délicieux cocktail préparé avec soin."

**DÉTECTION ALLERGÈNES & TAGS :**
- Allergènes officiels parmi : ["Gluten", "Crustacés", "Œufs", "Poissons", "Arachides", "Soja", "Lait", "Fruits à coque", "Céleri", "Moutarde", "Sésame", "Sulfites", "Lupin", "Mollusques"]
- Tags parmi : ["Végétarien", "Végan", "Sans Gluten", "Sans Lactose", "Halal", "Épicé", "Fait Maison", "Spécialité"]
- **Ne colle pas "Fait Maison" partout automatiquement.** Seuls les plats réellement faits maison reçoivent le tag.

---

**FORMAT DE RÉPONSE EXCLUSIF (JSON STRICT) :**

\`\`\`json
{
  "plats": [
    {
      "platId": "ID_DU_PLAT",
      "nom": {
        "fr": "Nom en français",
        "ar": "الاسم بالعربية",
        "en": "Name in English"
      },
      "description": {
        "fr": "Une description culinaire spécifique et gourmande de 1-2 phrases.",
        "ar": "وصف طهي مميز وشهي من جملة إلى جملتين باللغة العربية.",
        "en": "A specific, mouth-watering culinary description in English."
      },
      "allergenes": ["Gluten", "Lait"],
      "tags": ["Fait Maison"]
    }
  ]
}
\`\`\`

RÉPONDS UNIQUEMENT EN JSON VALIDE, SANS AUCUN TEXTE AUTOUR.
`;
};
