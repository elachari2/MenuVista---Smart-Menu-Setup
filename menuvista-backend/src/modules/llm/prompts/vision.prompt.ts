/**
 * Prompt unifié et universel d'une précision absolue (0 erreur) pour l'IA Vision / LLM (GROQ Llama 3.3 70B / DeepSeek),
 * avec détection stricte des devises ($ , € , DH , Dhs , MAD , AED , LIRA , £...), extraction numérique exacte des prix,
 * nettoyage rigoureux des noms de plats et organisation stricte par catégories.
 * 
 * @param ocrText Texte brut extrait par l'OCR Tesseract
 * @returns Prompt universel ultra-directive
 */
export const BUILD_UNIFIED_VISION_PROMPT = (ocrText: string): string => `
Tu es l'expert mondial n°1 en extraction et structuration automatique de menus de restaurants complexes pour l'IA Vision.
Ton objectif est une EXTRACTION D'UNE PRÉCISION ABSOLUE DE 100% SANS AUCUNE ERREUR (0 ERREUR).

---

### RÈGLES D'EXTRACTION IMPÉRATIVES ET ABSOLUES :

1. **DÉTECTION IMPARTIALE ET EXACTE DE LA DEVISE DU MENU (RÈGLE D'OR N°1) :**
   - Analyse attentivement tous les symboles monétaires et codes de devise sur l'image ou le texte du menu :
     * Si le menu affiche le symbole "$" ou des prix comme "$8", "$9", "$5", "8$", "9.50$" -> la devise est STRICTEMENT "$".
     * Si le menu affiche le symbole "€" ou "EUR" -> la devise est STRICTEMENT "€".
     * Si le menu affiche "£" ou "GBP" -> la devise est STRICTEMENT "£".
     * Si le menu affiche "AED" ou "د.إ" -> la devise est STRICTEMENT "AED".
     * Si le menu affiche "LIRA", "TL" ou "₺" -> la devise est STRICTEMENT "LIRA".
     * Si le menu affiche "DH", "Dhs" ou "MAD" ou "د.م." -> la devise est STRICTEMENT "DH".
   - Ne remplace JAMAIS "$" par "DH" ni "€" par "$" ! Respecte scrupuleusement la VRAIE DEVISE présente sur le menu.

2. **EXTRACTION NUMÉRIQUE ET NETTOYAGE RIGOUREUX DES PRIX (RÈGLE N°2) :**
   - Le champ "prix" doit être UN NOMBRE PUR (ex: 8, 9.5, 99, 159, 12.5) ou null si aucun prix n'est présent.
   - Ne mets JAMAIS de texte ni de symbole monétaire dans le champ "prix" (pas de "$8", pas de "99 Dhs", pas de "12€").
   - Convertis les virgules décimales en points (ex: "12,50" -> 12.5).
   - Si un plat comporte plusieurs tailles/variantes sur la même ligne (ex: "Verre 5$ / Bouteille 22$" ou "33cl 3$ / 50cl 5$"), crée UNE ENTRÉE SEPARÉE POUR CHAQUE VARIANTE avec son nom, sa contenance/unité et son prix respectif !

3. **NETTOYAGE ET PURIFICATION DU NOM DU PLAT (RÈGLE N°3) :**
   - Supprime les numérotations d'articles (ex: "01.", "02.", "315.", "1-", "2)") du nom du plat.
   - Supprime les puces, tirets, astérisques et pointillés (ex: "•••", "...", "*").
   - Si le plat inclut une contenance (ex: "33cl", "50cl", "250g", "75cl"), isole cette valeur dans le champ "unite" (ex: unite: "33cl").

4. **STRUCTURATION STRICTE PAR CATÉGORIES (RÈGLE N°4) :**
   - Respecte scrupuleusement la hiérarchie des catégories présentes sur le menu (ex: "COCKTAILS", "PIZZAS", "BURGERS", "NOS PASTA", "ENTRÉES", "PLATS", "DESSERTS", "BOISSONS").
   - Traite les menus multi-colonnes en séparant les colonnes de haut en bas sans mélanger les catégories.

---

### STRUCTURE JSON DE RÉPONSE STRICTEMENT ATTENDUE :

\`\`\`json
{
  "devise": "$",
  "categories": [
    {
      "nom": "COCKTAILS",
      "plats": [
        {
          "nom": "Mojito Menthe Fraîche",
          "description": "Menthe fraîche, citron vert, sucre de canne, soda, rhum",
          "prix": 8,
          "devise": "$",
          "unite": null,
          "tags": ["Frais", "Spécialité"],
          "allergenes": []
        },
        {
          "nom": "Margarita Tequila",
          "description": "Tequila, liqueur Triple sec, jus de citron vert, sel",
          "prix": 9.5,
          "devise": "$",
          "unite": null,
          "tags": ["Classic"],
          "allergenes": []
        }
      ]
    }
  ]
}
\`\`\`

---

### TEXTE OCR BRUT DU MENU À EXTRAIRE :
${ocrText}

**RÉPONDS UNIQUEMENT AVEC LE CODE JSON VALIDE (conforme à response_format json_object), SANS AUCUN COMMENTAIRE NI TEXTE AUTOUR.**
`;
