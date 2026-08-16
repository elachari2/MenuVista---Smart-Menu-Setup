import * as path from 'path';
import * as fs from 'fs';

/**
 * Script d'indexation du Dataset Gastronomique Universel MenuVista.
 */
async function buildUniversalGastronomyDataset() {
  console.log('📦 Génération et indexation du Dataset Gastronomique Universel MenuVista...');

  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const jsonPath = path.join(dataDir, 'dataset.json');

  const universalCategories = [
    { id: 1, nom: 'Pizza Margherita', categorie: 'Pizza', tags: 'italienne vegetarien fromage pizza', image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80' },
    { id: 2, nom: 'Cheeseburger Pur Boeuf', categorie: 'Burger', tags: 'viande burger fromage bacon', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
    { id: 3, nom: 'Arabic Shawarma Kebab', categorie: 'Shawarma', tags: 'oriental viande wrap poulet kebab', image_url: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80' },
    { id: 4, nom: 'Mojito Menthe Fraîche', categorie: 'Cocktail', tags: 'boisson cocktail menthe rhum frais', image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80' },
    { id: 5, nom: 'Fresh Orange Juice', categorie: 'Non-Alcoholic', tags: 'jus orange frais boisson bio fruit', image_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80' },
    { id: 6, nom: 'Cherry Lemonade', categorie: 'Non-Alcoholic', tags: 'limonade cerise boisson citron rafraichissant', image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80' },
    { id: 7, nom: 'Green Tea Mojito', categorie: 'Non-Alcoholic', tags: 'the vert menthe boisson mocktail sain', image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80' },
    { id: 8, nom: 'Espresso Barista', categorie: 'Coffee', tags: 'cafe espresso boisson chaud barista', image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&auto=format&fit=crop&q=80' },
    { id: 9, nom: 'Souris d Agneau Confite', categorie: 'Viande', tags: 'agneau tajine viande braise', image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
    { id: 10, nom: 'Filet de Saumon Rôti', categorie: 'Poisson', tags: 'saumon mer grillade poisson', image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80' },
    { id: 11, nom: 'Salade Cesar au Poulet', categorie: 'Entrée', tags: 'salade poulet entree frais', image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80' },
    { id: 12, nom: 'Linguine aux Gambas', categorie: 'Pâtes', tags: 'pasta gambas pates crevettes', image_url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80' },
    { id: 13, nom: 'Tiramisu au Café', categorie: 'Dessert', tags: 'dessert cafe sucre tiramisu', image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80' },
  ];

  fs.writeFileSync(jsonPath, JSON.stringify(universalCategories, null, 2), 'utf-8');
  console.log(`✅ DATASET GASTRONOMIQUE UNIVERSEL PRÊT ! ${universalCategories.length} visuels HD sauvegardés dans dataset.json.`);
}

buildUniversalGastronomyDataset().catch(console.error);
