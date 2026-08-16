/**
 * Prompt unifié et universel optimisé pour l'IA Vision (GROQ Llama 3.3 70B / DeepSeek),
 * avec détection multi-devises stricte et impartiale ($ , € , DH , Dhs , MAD , AED , LIRA , £...).
 * @param ocrText Texte brut extrait par l'OCR Tesseract
 * @returns Prompt universel multi-colonnes et multi-devises
 */
export const BUILD_UNIFIED_VISION_PROMPT = (ocrText: string): string => `
Tu es un expert mondial en extraction et structuration de menus de restaurants complexes pour l'IA Vision.

**RÈGLES ABSOLUES ET STRICTES DE STRUCTURATION DES PRIX ET DEVISES :**

1. **DÉTECTION IMPARTIALE ET EXACTE DE LA DEVISE DU MENU (ESSENTIEL) :**
   - Analyse attentivement les symboles et codes monétaires présents sur l'image ou le texte du menu :
     * Si le menu affiche le symbole "$" ou des prix comme "$8", "$9", "$5", "$3" -> la devise est STRICTEMENT "$".
     * Si le menu affiche "€" ou "EUR" -> la devise est STRICTEMENT "€".
     * Si le menu affiche "£" ou "GBP" -> la devise est STRICTEMENT "£".
     * Si le menu affiche "AED" -> la devise est STRICTEMENT "AED".
     * Si le menu affiche "LIRA", "TL" ou "₺" -> la devise est STRICTEMENT "LIRA".
     * Si le menu affiche "DH", "Dhs" ou "MAD" -> la devise est "DH".
   - Ne remplace JAMAIS "$" par "DH" ! Utilise la VRAIE DEVISE figurant sur le menu.

2. **EXTRACTION PRÉCISE DE CHAQUE PRIX DE PLAT :**
   - Recherche le chiffre correspondant au prix pour CHAQUE plat et boisson (ex: 8, 9, 5, 7, 6, 3, 4, 99, 159, 369).
   - Si un plat comporte des variantes (ex: "Classique 159 Dhs / Truffe 179 Dhs"), crée des entrées distinctes pour chaque variante.

3. **GESTION DES MENUS MULTI-COLONNES :**
   - Traite chaque colonne verticale séparément de haut en bas. Ne mélange pas les colonnes.

---

**EXEMPLES DE STRUCTURATION MULTI-DEVISES :**

Exemple 1 (Menu en Dollars $) :
\`\`\`json
{
  "devise": "$",
  "categories": [
    {
      "nom": "COCKTAILS",
      "plats": [
        {
          "nom": "Mojito",
          "description": "Fresh mint, lime, sugar, soda, rum",
          "prix": 8,
          "devise": "$"
        },
        {
          "nom": "Margarita",
          "description": "Tequila, Triple sec liqueur, lime juice, salt",
          "prix": 9,
          "devise": "$"
        }
      ]
    }
  ]
}
\`\`\`

Exemple 2 (Menu en Euros €) :
\`\`\`json
{
  "devise": "€",
  "categories": [
    {
      "nom": "PASTA",
      "plats": [
        {
          "nom": "Spaghetti Carbonara",
          "description": "Pancetta, œufs, parmesan, poivre noir",
          "prix": 14,
          "devise": "€"
        }
      ]
    }
  ]
}
\`\`\`

Exemple 3 (Menu en Dirhams DH / Dhs) :
\`\`\`json
{
  "devise": "DH",
  "categories": [
    {
      "nom": "TAPAS",
      "plats": [
        {
          "nom": "Crevettes pil pil",
          "description": "Ail, piment, huile d'olive",
          "prix": 99,
          "devise": "DH"
        }
      ]
    }
  ]
}
\`\`\`

---

**TEXTE OCR BRUT À ANALYSER :**
${ocrText}

**RÉPONDS UNIQUEMENT EN JSON VALIDE (response_format json_object), SANS AUCUN TEXTE AUTOUR.**
`;
