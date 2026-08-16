// scripts/index-dataset.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Déterminer le dossier data et s'assurer qu'il existe
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'dataset.db');
const db = new sqlite3.Database(dbPath);

// Lire le fichier des catégories Food-101 & Universal Food & Beverage
const categoriesFile = path.join(dataDir, 'categories.txt');
if (!fs.existsSync(categoriesFile)) {
  console.error(`❌ Fichier catégories non trouvé : ${categoriesFile}`);
  process.exit(1);
}

const categories = fs.readFileSync(categoriesFile, 'utf-8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0 && !line.startsWith('#'));

console.log(`📊 ${categories.length} catégories valides trouvées dans categories.txt`);
console.log('📥 Indexation des catégories dans SQLite FTS5...');

db.serialize(() => {
  // Supprimer l'ancienne table FTS5 si elle existe
  db.run(`DROP TABLE IF EXISTS image_index`, (err) => {
    if (err) {
      console.error('❌ Erreur suppression table:', err.message);
    }
  });

  // Créer la table avec FTS5 pour la recherche rapide
  db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS image_index 
    USING fts5(
      nom,           -- Nom du plat
      categorie,     -- Identifiant de catégorie
      cuisine,       -- Type de cuisine
      pays,          -- Pays d'origine
      tags,          -- Mots-clés de recherche
      image_path,    -- Chemin vers l'image
      source         -- Source du dataset
    );
  `, (err) => {
    if (err) {
      console.error('❌ Erreur création table FTS5:', err.message);
      return;
    }
    console.log('✅ Table image_index (FTS5) créée avec succès');
  });

  // Démarrer la transaction pour accélérer les insertions
  db.run('BEGIN TRANSACTION', (err) => {
    if (err) {
      console.error('❌ Erreur début transaction:', err.message);
    }
  });

  // Préparer la requête d'insertion
  const insertStmt = db.prepare(`
    INSERT INTO image_index (nom, categorie, cuisine, pays, tags, image_path, source)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (const cat of categories) {
    const nom = cat.replace(/_/g, ' ');
    const tags = cat.replace(/_/g, ' ');
    const imagePath = `food-101/${cat}`;

    insertStmt.run(
      nom,
      cat,
      'international',
      'Various',
      tags,
      imagePath,
      'food-101',
      (err) => {
        if (err) {
          console.error(`❌ Erreur insertion ${cat}:`, err.message);
        } else {
          count++;
        }
      }
    );
  }

  // Finaliser le statement préparé
  insertStmt.finalize((err) => {
    if (err) {
      console.error('❌ Erreur finalisation statement:', err.message);
    }
  });

  // Valider la transaction
  db.run('COMMIT', (err) => {
    if (err) {
      console.error('❌ Erreur COMMIT transaction:', err.message);
    } else {
      console.log(`✅ ${count} catégories indexées avec succès`);
    }
  });

  // Vérification post-indexation
  db.get('SELECT COUNT(*) as total FROM image_index', (err, row) => {
    if (err) {
      console.error('❌ Erreur vérification total:', err.message);
    } else {
      console.log(`📊 Total indexé : ${row ? row.total : 0} entrées`);
      console.log('✅ Indexation terminée avec succès !');
    }

    // Fermeture propre de la base de données
    db.close((closeErr) => {
      if (closeErr) {
        console.error('❌ Erreur fermeture base de données:', closeErr.message);
      }
    });
  });
});