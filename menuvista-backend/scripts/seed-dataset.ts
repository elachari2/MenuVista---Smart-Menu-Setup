import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function seedDataset() {
  console.log('🚀 Initialisation du dataset local de photographies culinaires (Sprint 4)...');

  const dataDir = path.resolve(process.cwd(), 'data');
  const imagesDir = path.join(dataDir, 'images');
  const fallbackDir = path.join(dataDir, 'fallback');

  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
  if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });

  const sampleDishes = [
    { id: 1, nom: 'Pizza Margherita', categorie: 'Pizza', tags: 'italienne vegetarien fromage', filename: 'margherita.webp', color: '#e74c3c' },
    { id: 2, nom: 'Pizza Quatre Fromages', categorie: 'Pizza', tags: 'italienne vegetarien fromage', filename: '4fromages.webp', color: '#f39c12' },
    { id: 3, nom: 'Cheeseburger Pur Boeuf', categorie: 'Burger', tags: 'viande bacon burger', filename: 'cheeseburger.webp', color: '#d35400' },
    { id: 4, nom: 'Burger Poulet Croupillant', categorie: 'Burger', tags: 'poulet frites burger', filename: 'poulet_burger.webp', color: '#e67e22' },
    { id: 5, nom: 'Crevettes pil pil', categorie: 'Tapas', tags: 'crevettes ail piment epice', filename: 'crevettes_pilpil.webp', color: '#c0392b' },
    { id: 6, nom: 'Mojito Menthe Fraîche', categorie: 'Boisson', tags: 'cocktail rhum menthe citron', filename: 'mojito.webp', color: '#27ae60' },
    { id: 7, nom: 'Margarita Cocktail', categorie: 'Boisson', tags: 'cocktail tequila citron', filename: 'margarita_cocktail.webp', color: '#16a085' },
    { id: 8, nom: 'Souris d Agneau Confite', categorie: 'Viande', tags: 'agneau confit tajine fait maison', filename: 'agneau_confit.webp', color: '#8e44ad' },
    { id: 9, nom: 'Tartare de Filet de Boeuf', categorie: 'Viande', tags: 'boeuf tartare salade', filename: 'tartare_boeuf.webp', color: '#2c3e50' },
    { id: 10, nom: 'Filet de Saumon Rôti', categorie: 'Poisson', tags: 'saumon poisson riz legumes', filename: 'saumon_roti.webp', color: '#e67e22' },
    { id: 11, nom: 'Linguine aux Gambas', categorie: 'Pâtes', tags: 'pates gambas ail huile', filename: 'linguine_gambas.webp', color: '#f1c40f' },
    { id: 12, nom: 'Risotto aux Cèpes', categorie: 'Pâtes', tags: 'risotto champignon parmesan', filename: 'risotto_cepes.webp', color: '#7f8c8d' },
    { id: 13, nom: 'Salade Cesar au Poulet', categorie: 'Entrée', tags: 'salade poulet parmesan', filename: 'salade_cesar.webp', color: '#2ecc71' },
    { id: 14, nom: 'Houmous et Pain Pita', categorie: 'Entrée', tags: 'oriental vegetarien houmous', filename: 'houmous.webp', color: '#f39c12' },
    { id: 15, nom: 'Tiramisu au Café', categorie: 'Dessert', tags: 'dessert cafe masque', filename: 'tiramisu.webp', color: '#34495e' },
  ];

  const datasetList = [];

  for (const dish of sampleDishes) {
    const filePath = path.join(imagesDir, dish.filename);
    const webpUrl = `/images/dataset/${dish.filename}`;

    const safeNom = escapeXml(dish.nom);
    const safeCat = escapeXml(dish.categorie);

    const svgBuffer = Buffer.from(`
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${dish.color}"/>
        <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">${safeNom}</text>
        <text x="50%" y="60%" font-family="Arial, sans-serif" font-size="18" fill="#f0f0f0" text-anchor="middle">MenuVista Food Dataset (${safeCat})</text>
      </svg>
    `);

    await sharp(svgBuffer).webp({ quality: 85 }).toFile(filePath);

    datasetList.push({
      id: dish.id,
      nom: dish.nom,
      categorie: dish.categorie,
      tags: dish.tags,
      image_url: webpUrl,
    });
  }

  // Écrire data/dataset.json
  const jsonPath = path.join(dataDir, 'dataset.json');
  fs.writeFileSync(jsonPath, JSON.stringify(datasetList, null, 2), 'utf-8');

  // Générer les images de repli (Fallback per category)
  const fallbacks = [
    { name: 'pizza.jpg', cat: 'Pizza', color: '#e74c3c' },
    { name: 'burger.jpg', cat: 'Burger', color: '#d35400' },
    { name: 'salade.jpg', cat: 'Salade & Entrées', color: '#2ecc71' },
    { name: 'dessert.jpg', cat: 'Desserts', color: '#e84393' },
    { name: 'boisson.jpg', cat: 'Boissons & Cocktails', color: '#0984e3' },
    { name: 'viande.jpg', cat: 'Viandes', color: '#6c5ce7' },
    { name: 'poisson.jpg', cat: 'Poissons', color: '#00cec9' },
    { name: 'plat.jpg', cat: 'Plat Gastronomique', color: '#E85D2C' },
  ];

  for (const fb of fallbacks) {
    const fbPath = path.join(fallbackDir, fb.name);
    const safeCat = escapeXml(fb.cat);

    const svgBuffer = Buffer.from(`
      <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${fb.color}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">${safeCat} (Image de Repli)</text>
      </svg>
    `);
    await sharp(svgBuffer).jpeg({ quality: 85 }).toFile(fbPath);
  }

  console.log(`✅ DATASET SEED RÉUSSI ! ${datasetList.length} visuels WebP indexés dans dataset.json.`);
  console.log(`📁 Fichier JSON : ${jsonPath}`);
}

seedDataset().catch((err) => {
  console.error('❌ Échec du seed dataset:', err);
});
