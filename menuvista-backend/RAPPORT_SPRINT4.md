# 📘 Rapport d'Exécution — Sprint 4 : Association de Visuels & File BullMQ

Ce document récapitule l'ensemble des travaux techniques, des résolutions de bugs et des développements effectués sur **MenuVista Backend**.

---

## 📋 Table des Matières
1. [Résolution du Problème SQLite (Node v24 / Windows)](#1-résolution-du-problème-sqlite)
2. [Nettoyage et Harmonisation de l'Arborescence `data/`](#2-nettoyage-et-harmonisation-de-larborescence-data)
3. [Service de Matching FTS5 (`ImageMatchingService`)](#3-service-de-matching-fts5)
4. [Traitement Asynchrone via File d'Attente BullMQ (`QueueModule`)](#4-traitement-asynchrone-via-file-dattente-bullmq)
5. [Tests et Validations](#5-tests-et-validations)

---

## 1. 🔧 Résolution du Problème SQLite

### Diagnostic
- **Problème** : `better-sqlite3` et `sqlite3` standard échouaient au chargement sur Windows sous Node.js v24.18.0 (erreur `Could not locate the bindings file`).
- **Cause** : 
  1. Node.js v24 utilise l'ABI `node-v137-win32-x64` pour lequel aucune binaire précompilée C++ n'était incluse par défaut.
  2. Npm 10+ bloquait les scripts d'installation (`install-scripts`) par sécurité.

### Solution Appliquée
1. Remplacement de `better-sqlite3` par `sqlite3`.
2. Exécution de `npx prebuild-install -r napi` dans `sqlite3` pour télécharger la binaire universelle **N-API**.
3. Réécriture de `scripts/index-dataset.js` avec :
   - Requêtes préparées `db.prepare()`.
   - Modèle asynchrone `db.serialize()`.
   - Transactions accélérées (`BEGIN TRANSACTION` / `COMMIT`).
   - Table virtuelle **FTS5** `image_index`.

---

## 2. 📁 Nettoyage et Harmonisation de l'Arborescence `data/`

L'arborescence a été simplifiée pour éliminer les répertoires vides et doublons (`dataset/`, `datasets/`).

### Structure Finale Unifiée (`data/`)

```text
menuvista-backend/data/
├── dataset.db           # Base SQLite FTS5 (101 catégories indexées)
├── dataset.json         # Index JSON en mémoire (visuels HD)
├── categories.txt       # Liste source des 101 catégories Food-101
├── images/              # Images HD (.webp) servies via /images/dataset/
└── fallback/            # Images par défaut (.jpg) servies via /images/fallback/
```

---

## 3. 🔍 Service de Matching FTS5 (`ImageMatchingService`)

Création du service de recherche dans `src/modules/image-matching/image-matching.service.ts` :

### Fonctionnalités
- **Recherche Full-Text Search (FTS5)** : Évaluation des termes (`nom`, `categorie`, `tags`) directement dans `dataset.db`.
- **Normalisation du Score** : Conversion du rang FTS5 en un score compris entre `0.0` et `1.0`.
- **Fallback Automatique** : Si aucun résultat ne dépasse le seuil de pertinence (`0.3`), le système retourne une image générique par catégorie (`pizza.jpg`, `burger.jpg`, `salade.jpg`, etc.).

---

## 4. ⚡ Traitement Asynchrone via File d'Attente BullMQ (`QueueModule`)

Mise en place de l'infrastructure asynchrone basée sur Redis :

1. **`QueueService` (`src/modules/queue/queue.service.ts`)** : 
   - Ajout des jobs de matching (`match-menu`) dans la file `image-matching`.
2. **`ImageMatchingProcessor` (`src/modules/queue/image-matching.processor.ts`)** : 
   - Worker BullMQ qui dépile et traite chaque plat du menu.
   - Suivi d'avancement par pourcentage via `job.updateProgress()`.
3. **`QueueModule` (`src/modules/queue/queue.module.ts`) & `AppModule` (`src/app.module.ts`)** :
   - Enregistrement de la file avec 3 essais (retry) et stratégie de backoff exponentiel.

---

## 5. 🧪 Tests et Validations

### 1. Indexation du Dataset (101 catégories)
```powershell
node scripts/index-dataset.js
```
*Résultat :* `✅ 101 catégories indexées avec succès dans SQLite FTS5`

### 2. Vérification SQL Directe
```powershell
node -e "const sqlite3 = require('sqlite3').verbose(); const db = new sqlite3.Database('./data/dataset.db'); db.get('SELECT COUNT(*) as total FROM image_index', (err, row) => console.log('Total:', row.total)); db.close();"
```
*Résultat :* `Total: 101`

### 3. Test de Recherche FTS5
```powershell
node -e "const sqlite3 = require('sqlite3').verbose(); const db = new sqlite3.Database('./data/dataset.db'); db.get('SELECT image_path, categorie, rank as score FROM image_index WHERE image_index MATCH ? ORDER BY rank LIMIT 1', ['pizza'], (err, row) => console.log('Match Result:', row)); db.close();"
```
*Résultat :* `Match Result: { image_path: 'food-101/pizza', categorie: 'pizza', score: -7.39 }`

### 4. Tests Unitaires Jest
- Fichier `test/image-matching/matching.spec.ts`.
