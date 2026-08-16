import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function seedDataset() {
  console.log('🚀 Initialisation du dataset local de photographies culinaires (50+ Plats)...');

  const dataDir = path.resolve(process.cwd(), 'data');
  const imagesDir = path.join(dataDir, 'images');
  const fallbackDir = path.join(dataDir, 'fallback');

  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
  if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });

  const sampleDishes = [
    // PIZZAS
    { id: 1, nom: 'Pizza Margherita', categorie: 'Pizza', tags: 'italienne vegetarien fromage margherita tomate basilic', filename: 'margherita.webp', color: '#e74c3c' },
    { id: 2, nom: 'Pizza Quatre Fromages', categorie: 'Pizza', tags: 'italienne fromage gorgonzola mozzarella emmental parmesan 4fromages', filename: '4fromages.webp', color: '#f39c12' },
    { id: 3, nom: 'Pizza Pepperoni', categorie: 'Pizza', tags: 'italienne viande pepperoni salami epice spicy', filename: 'pizza_pepperoni.webp', color: '#c0392b' },
    { id: 4, nom: 'Pizza Calzone Soufflée', categorie: 'Pizza', tags: 'italienne calzone chausson jambon fromage oeuf', filename: 'pizza_calzone.webp', color: '#d35400' },
    { id: 5, nom: 'Pizza Végétarienne', categorie: 'Pizza', tags: 'italienne vegetarien poivron champignon olive courgette bio', filename: 'pizza_veggie.webp', color: '#27ae60' },
    { id: 6, nom: 'Pizza Poulet BBQ', categorie: 'Pizza', tags: 'poulet bbq oignon fumee cheddar pizza', filename: 'pizza_bbq.webp', color: '#e67e22' },
    { id: 7, nom: 'Pizza Reine', categorie: 'Pizza', tags: 'italienne jambon champignon fromage pizza reine', filename: 'pizza_reine.webp', color: '#e74c3c' },
    { id: 8, nom: 'Pizza Truffe & Burrata', categorie: 'Pizza', tags: 'italienne gourmet truffe burrata roquette fromage', filename: 'pizza_truffe.webp', color: '#2c3e50' },

    // BURGERS
    { id: 9, nom: 'Cheeseburger Pur Boeuf', categorie: 'Burger', tags: 'viande bacon burger boeuf cheddar classic', filename: 'cheeseburger.webp', color: '#d35400' },
    { id: 10, nom: 'Burger Poulet Crispy', categorie: 'Burger', tags: 'poulet frites burger crispy croustillant mayonnaise', filename: 'poulet_burger.webp', color: '#e67e22' },
    { id: 11, nom: 'Double Bacon Cheese Burger', categorie: 'Burger', tags: 'viande burger bacon double boeuf cheddar barbecue', filename: 'burger_bacon.webp', color: '#c0392b' },
    { id: 12, nom: 'Smash Burger Gourmet', categorie: 'Burger', tags: 'viande burger smash boeuf caramelise pickle cheddar', filename: 'burger_smash.webp', color: '#8e44ad' },
    { id: 13, nom: 'Veggie Burger Avocat', categorie: 'Burger', tags: 'vegetarien burger avocat quinoa galette sain bio', filename: 'burger_veggie.webp', color: '#2ecc71' },
    { id: 14, nom: 'Burger Champignons & Swiss', categorie: 'Burger', tags: 'viande burger champignon emmental boeuf gourmet', filename: 'burger_swiss.webp', color: '#7f8c8d' },

    // VIANDES & GRILLS
    { id: 15, nom: 'Souris d Agneau Confite', categorie: 'Viande', tags: 'agneau tajine viande braise confit romarin purees', filename: 'agneau_confit.webp', color: '#8e44ad' },
    { id: 16, nom: 'Tartare de Filet de Bœuf', categorie: 'Viande', tags: 'boeuf tartare viande cru oeuf frites salade chef', filename: 'tartare_boeuf.webp', color: '#2c3e50' },
    { id: 17, nom: 'Steak Haché Grillé Frites', categorie: 'Viande', tags: 'viande boeuf steak frites grillade sauce poivre', filename: 'steak_frites.webp', color: '#c0392b' },
    { id: 18, nom: 'Poulet Rôti aux Herbes', categorie: 'Viande', tags: 'poulet roti viande braise pommes terre jus', filename: 'poulet_roti.webp', color: '#d35400' },
    { id: 19, nom: 'Brochettes d Agneau Grillées', categorie: 'Viande', tags: 'agneau brochettes barbecue grillade epices riz', filename: 'brochettes_agneau.webp', color: '#e67e22' },
    { id: 20, nom: 'Wok de Bœuf aux Légumes', categorie: 'Viande', tags: 'boeuf wok legumes asiatique sauce soja', filename: 'wok_boeuf.webp', color: '#16a085' },

    // POISSONS & FRUITS DE MER
    { id: 21, nom: 'Filet de Saumon Rôti', categorie: 'Poisson', tags: 'saumon mer grillade poisson riz legumes aneth', filename: 'saumon_roti.webp', color: '#e67e22' },
    { id: 22, nom: 'Crevettes Sautées Pil Pil', categorie: 'Poisson', tags: 'crevettes pilpil ail piment persil tapas fruits mer', filename: 'crevettes_pilpil.webp', color: '#c0392b' },
    { id: 23, nom: 'Calamars Grillés Plancha', categorie: 'Poisson', tags: 'calamar plancha mer persillade citron poisson', filename: 'calamars_grilles.webp', color: '#2980b9' },
    { id: 24, nom: 'Fish and Chips Sauce Tartare', categorie: 'Poisson', tags: 'fish chips poisson pane frites citron britannique', filename: 'fish_and_chips.webp', color: '#f39c12' },
    { id: 25, nom: 'Plateau Sushi Maki Saumon', categorie: 'Poisson', tags: 'sushi maki saumon avocat asiatique japonais poisson', filename: 'sushi_maki.webp', color: '#27ae60' },

    // SALADES & ENTRÉES
    { id: 26, nom: 'Salade César au Poulet', categorie: 'Salade', tags: 'salade poulet entree frais parmesan croutons cesar', filename: 'salade_cesar.webp', color: '#2ecc71' },
    { id: 27, nom: 'Houmous & Pain Pita', categorie: 'Entrée', tags: 'oriental vegetarien houmous pois chiche pita huile olive tapas', filename: 'houmous.webp', color: '#f39c12' },
    { id: 28, nom: 'Salade Niçoise au Thon', categorie: 'Salade', tags: 'salade thon oeuf haricot olive frais mediterranee', filename: 'salade_nicoise.webp', color: '#16a085' },
    { id: 29, nom: 'Caprese Tomate Burrata', categorie: 'Salade', tags: 'salade mozza tomate basilic burrata vegetarien pesto', filename: 'caprese_burrata.webp', color: '#e74c3c' },
    { id: 30, nom: 'Salade Grecque Féta', categorie: 'Salade', tags: 'salade feta concombre poivron olive grecque vegetarien', filename: 'salade_grecque.webp', color: '#2980b9' },

    // PÂTES & RISOTTOS
    { id: 31, nom: 'Linguine aux Gambas', categorie: 'Pâtes', tags: 'pasta gambas pates crevettes mer ail persil', filename: 'linguine_gambas.webp', color: '#f1c40f' },
    { id: 32, nom: 'Risotto aux Cèpes', categorie: 'Pâtes', tags: 'risotto champignon cepes parmesan creme italienne', filename: 'risotto_cepes.webp', color: '#7f8c8d' },
    { id: 33, nom: 'Spaghetti Carbonara', categorie: 'Pâtes', tags: 'pates pasta carbonara pancetta oeuf parmesan italienne', filename: 'spaghetti_carbonara.webp', color: '#f39c12' },
    { id: 34, nom: 'Penne Bolognese Pur Bœuf', categorie: 'Pâtes', tags: 'pates pasta bolognese boeuf tomate sauce parmesan', filename: 'penne_bolognese.webp', color: '#c0392b' },
    { id: 35, nom: 'Lasagnes Maison au Four', categorie: 'Pâtes', tags: 'pates pasta lasagne boeuf gratine bechamel tomate', filename: 'lasagnes_maison.webp', color: '#d35400' },
    { id: 36, nom: 'Pesto Genovese & Pignons', categorie: 'Pâtes', tags: 'pates pasta pesto basilic vegetarien pignons parmesan', filename: 'pesto_genovese.webp', color: '#27ae60' },

    // ORIENTAL & MAROCAIN
    { id: 37, nom: 'Tajine de Poulet Citrons Confits', categorie: 'Plat', tags: 'tajine poulet citron olives marocain oriental epices fait maison', filename: 'tajine_poulet.webp', color: '#f39c12' },
    { id: 38, nom: 'Tajine d Agneau aux Pruneaux', categorie: 'Plat', tags: 'tajine agneau pruneaux amandes marocain oriental epices sucre sale', filename: 'tajine_agneau.webp', color: '#8e44ad' },
    { id: 39, nom: 'Couscous Royal 7 Légumes', categorie: 'Plat', tags: 'couscous royal legumes poulet merguez agneau semoule oriental marocain', filename: 'couscous_royal.webp', color: '#d35400' },
    { id: 40, nom: 'Arabic Shawarma Kebab', categorie: 'Plat', tags: 'oriental viande wrap poulet kebab shawarma chawarma pita garlic', filename: 'shawarma_kebab.webp', color: '#e67e22' },
    { id: 41, nom: 'Assiette Falafel Crispy', categorie: 'Plat', tags: 'falafel vegetarien pois chiche tahina oriental hummus salad', filename: 'falafel_assiette.webp', color: '#2ecc71' },

    // BOISSONS & COCKTAILS
    { id: 42, nom: 'Mojito Menthe Fraîche', categorie: 'Boisson', tags: 'boisson cocktail menthe rhum frais glace pilee mocktail', filename: 'mojito.webp', color: '#27ae60' },
    { id: 43, nom: 'Margarita Cocktail', categorie: 'Boisson', tags: 'boisson cocktail tequila citron sel aperitif', filename: 'margarita_cocktail.webp', color: '#16a085' },
    { id: 44, nom: 'Jus d Orange Pressé', categorie: 'Boisson', tags: 'jus orange frais boisson bio fruit vitamine detox', filename: 'jus_orange.webp', color: '#f39c12' },
    { id: 45, nom: 'Limonade Cerise Citron', categorie: 'Boisson', tags: 'limonade cerise boisson citron rafraichissant frais', filename: 'limonade_cerise.webp', color: '#e74c3c' },
    { id: 46, nom: 'Thé Glacé Pêche Menthe', categorie: 'Boisson', tags: 'the vert menthe boisson mocktail sain peche iced tea', filename: 'the_glace.webp', color: '#d35400' },
    { id: 47, nom: 'Espresso Barista Italien', categorie: 'Boisson', tags: 'cafe espresso boisson chaud barista arabica', filename: 'espresso.webp', color: '#2c3e50' },
    { id: 48, nom: 'Cappuccino Mousse Lait', categorie: 'Boisson', tags: 'cafe cappuccino lait boisson chaud barista cacao', filename: 'cappuccino.webp', color: '#7f8c8d' },
    { id: 49, nom: 'Smoothie Fruits Rouges', categorie: 'Boisson', tags: 'smoothie fraise framboise banane fruit boisson bio', filename: 'smoothie_fruits_rouges.webp', color: '#8e44ad' },

    // DESSERTS
    { id: 50, nom: 'Tiramisu au Café', categorie: 'Dessert', tags: 'dessert cafe sucre tiramisu mascarpone cacao italienne', filename: 'tiramisu.webp', color: '#34495e' },
    { id: 51, nom: 'Fondant au Chocolat Coulant', categorie: 'Dessert', tags: 'dessert chocolat fondant gateau vanille glace', filename: 'fondant_chocolat.webp', color: '#2c3e50' },
    { id: 52, nom: 'Tarte Tatin Pommes Caramel', categorie: 'Dessert', tags: 'dessert tarte tatin pomme caramel glace vanille', filename: 'tarte_tatin.webp', color: '#d35400' },
    { id: 53, nom: 'Crème Brûlée Vanille', categorie: 'Dessert', tags: 'dessert creme brulee vanille caramelise francais', filename: 'creme_brulee.webp', color: '#f39c12' },
    { id: 54, nom: 'Cheesecake New York Fraise', categorie: 'Dessert', tags: 'dessert cheesecake fraise coulis fromage sucre american', filename: 'cheesecake_fraise.webp', color: '#e74c3c' },
    { id: 55, nom: 'Coupe Glace Artisanale', categorie: 'Dessert', tags: 'dessert glace vanille chocolat fraise chantilly', filename: 'coupe_glace.webp', color: '#9b59b6' },
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
        <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle">${safeNom}</text>
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
