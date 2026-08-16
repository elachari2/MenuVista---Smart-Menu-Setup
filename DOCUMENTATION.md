#  MenuVista — Documentation Générale du Projet & Guide de Test

---

## 1.  Résumé Global des Réalisations (Ce qu'on a fait)

Le projet **MenuVista** est une solution globale intelligente permettant d'automatiser la numérisation, la structuration, l'enrichissement nutritionnel et la mise en valeur visuelle de cartes et menus de restaurants à partir d'une simple photo ou d'un fichier PDF.

### Accomplissements Majeurs :
1. **Numérisation OCR & Structuration IA Multimodale** :
   - Prétraitement d'image avec `Sharp` (accentuation des contrastes, réduction du bruit).
   - Extraction de texte par OCR `Tesseract.js`.
   - Analyse multimodale avancée via `GROQ Llama 3.3 70B` et fallback local déterministe basé sur un découpage par blocs (`Chunking`).
   - Conservation exacte des devises ($ , € , DH , AED , LIRA , £) et des prix d'origine sans forcer de conversion abusive.

2. **Module d'Enrichissement Nutritionnel & Allergènes 100% Local** :
   - Calcul automatique et estimation des calories et macronutriments (Protéines, Glucides, Lipides, Fibres, Sodium, Sucres).
   - Détermination automatique du **Nutri-Score** (de A à E).
   - Détection des **14 allergènes réglementaires majeurs** (Gluten, Lait, Crustacés, Œufs, Arachides, etc.) et attribution des régimes (Végétarien, Végan, Sans Gluten, Halal...).

3. **Moteur Photographique Gastronomique & Matching Visuel Local** :
   - Indexation et matching d'images HD 100% en local (sans aucune dépendance à des API payantes ou externes).
   - Conversion automatique des images téléchargées en format **WebP HD** ultra-optimisé.

4. **Interface Utilisateur Moderne (React + TailwindCSS + Lucide)** :
   - Cartes de plats épurées et élégantes.
   - Modal de modification intégrant la prévisualisation HD, l'édition des nutriments, et un module de remplacement d'image par lien URL direct avec aperçu immédiat.

## 2.  Stack Technologique & Méthodologie

###  Backend (`menuvista-backend`)
- **Framework** : NestJS (TypeScript, Node.js)
- **Base de Données** : PostgreSQL via TypeORM & SQLite3 (Indexation FTS5 locale pour le dataset)
- **Traitement d'Images** : Sharp (redimensionnement, conversion WebP HD)
- **OCR & IA** : Tesseract.js, GROQ SDK (Llama 3.3 70B Versatile)
- **Files d'Attente** : BullMQ & Redis
- **Tests** : Jest (Unitaires, Intégration, Benchmarks de performance)

###  Frontend (`menuvista-frontend`)
- **Framework** : React 18 avec Vite et TypeScript
- **Styling** : TailwindCSS, Vanilla CSS, Framer Motion (animations fluides)
- **Icônes & UI** : Lucide React, Composants modulaires réutilisables

###  Méthodologie d'Architecture :
- **Clean Architecture & Inversion de Contrôle** (Modules NestJS autonomes).
- **Stratégie Fallback à 3 Niveaux** (GROQ Vision ➔ Parser Local par Chunks ➔ Dataset FTS5/SQLite).


## 3.  Guide de Démarrage & Commandes de Test

### 1️ Prérequis :
Assurez-vous d'avoir Node.js (v18+) installé.


### 2 Tester & Lancer le Backend (`menuvista-backend`)

Ouvrez un terminal dans le dossier `menuvista-backend` :

```bash
# Se placer dans le dossier backend
cd menuvista-backend

# 1. Compiler le projet backend (Vérification des types TypeScript)
npm run build

# 2. Exécuter l'ensemble de la suite de tests unitaires et benchmarks
npm test

# 3. Lancer le serveur backend en mode développement (Port 3000)
npm run start:dev
```

> **Le serveur backend démarre sur** : `http://localhost:3000`


### 3 Lancer le Frontend (`menuvista-frontend`)

Ouvrez un deuxième terminal dans le dossier `menuvista-frontend` :

```bash
# Se placer dans le dossier frontend
cd menuvista-frontend

# 1. Compiler le projet frontend
npm run build

# 2. Lancer l'application web en mode dev
npm run dev
```

> **L'application web est accessible sur** : `http://localhost:5173` (ou l'URL affichée par Vite).


##  Procédure de Test Manuel de l'Application Web

1. Rendez-vous sur l'interface web (`http://localhost:5173`).
2. **Uploadez une image de menu** (ex: un menu contenant des boissons ou des plats).
3. Constatez l'affichage épuré des cartes avec les **nutriments, Nutri-Score et allergènes**.
4. Cliquez sur le bouton **`Modifier`** au bas d'un plat (ex: `Latte`).
5. Dans le champ **Visuel du plat (Image)**, collez une nouvelle URL d'image (ex: une image Google ou Unsplash) et cliquez sur **`Appliquer Lien`**.
6. Cliquez sur **`Enregistrer`** : la carte sur l'écran principal se met à jour avec le nouveau visuel.
7. **Re-test** : Uploadez à nouveau le même menu ➔ Le plat `Latte` réapparaît automatiquement avec la **nouvelle image** que vous aviez enregistrée !
