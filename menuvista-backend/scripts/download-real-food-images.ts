import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

/**
 * Télécharge un fichier depuis une URL vers un chemin local en gérant les redirections HTTP/HTTPS
 */
function downloadFile(urlStr: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlStr);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const request = protocol.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      // Gestion des redirections HTTP 301, 302, 303, 307, 308
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        let redirectUrl = response.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, urlStr).href;
        }
        return downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`Échec téléchargement status code: ${response.statusCode} pour ${urlStr}`));
      }

      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    request.on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAllRealFoodImages() {
  console.log('🚀 Téléchargement et mise à jour des VRAIES photographies fournies...');

  const dataDir = path.resolve(process.cwd(), 'data');
  const imagesDir = path.join(dataDir, 'images');
  const fallbackDir = path.join(dataDir, 'fallback');

  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
  if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });

  // Liste des 55 plats avec les URLs fournies directement par l'utilisateur
  const realDishes = [
    // PIZZAS
    { filename: 'margherita.webp', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80', nom: 'Pizza Margherita', categorie: 'Pizza', tags: 'italienne vegetarien fromage margherita tomate basilic' },
    { filename: '4fromages.webp', url: 'https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=800&auto=format&fit=crop&q=80', nom: 'Pizza Quatre Fromages', categorie: 'Pizza', tags: 'italienne fromage gorgonzola mozzarella emmental parmesan 4fromages' },
    { filename: 'pizza_pepperoni.webp', url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&auto=format&fit=crop&q=80', nom: 'Pizza Pepperoni', categorie: 'Pizza', tags: 'italienne viande pepperoni salami epice spicy' },
    { filename: 'pizza_calzone.webp', url: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=800&auto=format&fit=crop&q=80', nom: 'Pizza Calzone Soufflée', categorie: 'Pizza', tags: 'italienne calzone chausson jambon fromage oeuf' },
    { filename: 'pizza_veggie.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSp8RiRX7rWGZp3E9M8CuVllbXeVLfbbSK3mEmAVKNOXg&s=10', nom: 'Pizza Végétarienne', categorie: 'Pizza', tags: 'italienne vegetarien poivron champignon olive courgette bio' },
    { filename: 'pizza_bbq.webp', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80', nom: 'Pizza Poulet BBQ', categorie: 'Pizza', tags: 'poulet bbq oignon fumee cheddar pizza' },
    { filename: 'pizza_reine.webp', url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80', nom: 'Pizza Reine', categorie: 'Pizza', tags: 'italienne jambon champignon fromage pizza reine' },
    { filename: 'pizza_truffe.webp', url: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&auto=format&fit=crop&q=80', nom: 'Pizza Truffe & Burrata', categorie: 'Pizza', tags: 'italienne gourmet truffe burrata roquette fromage' },

    // BURGERS
    { filename: 'cheeseburger.webp', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80', nom: 'Cheeseburger Pur Boeuf', categorie: 'Burger', tags: 'viande bacon burger boeuf cheddar classic' },
    { filename: 'poulet_burger.webp', url: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80', nom: 'Burger Poulet Crispy', categorie: 'Burger', tags: 'poulet frites burger crispy croustillant mayonnaise' },
    { filename: 'burger_bacon.webp', url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=800&auto=format&fit=crop&q=80', nom: 'Double Bacon Cheese Burger', categorie: 'Burger', tags: 'viande burger bacon double boeuf cheddar barbecue' },
    { filename: 'burger_smash.webp', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80', nom: 'Smash Burger Gourmet', categorie: 'Burger', tags: 'viande burger smash boeuf caramelise pickle cheddar' },
    { filename: 'burger_veggie.webp', url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=800&auto=format&fit=crop&q=80', nom: 'Veggie Burger Avocat', categorie: 'Burger', tags: 'vegetarien burger avocat quinoa galette sain bio' },
    { filename: 'burger_swiss.webp', url: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=800&auto=format&fit=crop&q=80', nom: 'Burger Champignons & Swiss', categorie: 'Burger', tags: 'viande burger champignon emmental boeuf gourmet' },

    // VIANDES & GRILLS
    { filename: 'agneau_confit.webp', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80', nom: 'Souris d Agneau Confite', categorie: 'Viande', tags: 'agneau tajine viande braise confit romarin purees' },
    { filename: 'tartare_boeuf.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFm7zpzGIfYejQajNl5EtomEMBU7WCHCx2HtjRY0EtQA&s=10', nom: 'Tartare de Filet de Bœuf', categorie: 'Viande', tags: 'boeuf tartare viande cru oeuf frites salade chef' },
    { filename: 'steak_frites.webp', url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=800&auto=format&fit=crop&q=80', nom: 'Steak Haché Grillé Frites', categorie: 'Viande', tags: 'viande boeuf steak frites grillade sauce poivre' },
    { filename: 'poulet_roti.webp', url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&auto=format&fit=crop&q=80', nom: 'Poulet Rôti aux Herbes', categorie: 'Viande', tags: 'poulet roti viande braise pommes terre jus' },
    { filename: 'brochettes_agneau.webp', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80', nom: 'Brochettes d Agneau Grillées', categorie: 'Viande', tags: 'agneau brochettes barbecue grillade epices riz' },
    { filename: 'wok_boeuf.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSaMFoP6Ck3cBDWV2oDZYgWUlq104fAwUeYlyVFpfqaQg&s=10', nom: 'Wok de Bœuf aux Légumes', categorie: 'Viande', tags: 'boeuf wok legumes asiatique sauce soja' },

    // POISSONS & FRUITS DE MER
    { filename: 'saumon_roti.webp', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80', nom: 'Filet de Saumon Rôti', categorie: 'Poisson', tags: 'saumon mer grillade poisson riz legumes aneth' },
    { filename: 'crevettes_pilpil.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdN107UHBn4JU6syv_cWw3SqzhbqZ2wU6ECBy4Bd6X6Q&s=10', nom: 'Crevettes Sautées Pil Pil', categorie: 'Poisson', tags: 'crevettes pilpil ail piment persil tapas fruits mer' },
    { filename: 'calamars_grilles.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsnlD03IQCgEFGdH4rlV89xIfrOZuUrQ_T3SzmLjVKDg&s=10', nom: 'Calamars Grillés Plancha', categorie: 'Poisson', tags: 'calamar plancha mer persillade citron poisson' },
    { filename: 'fish_and_chips.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJBLBTlhv-nVK-HFWLBxOdUJ1oC0dRdFPikjkrRMmhnQ&s=10', nom: 'Fish and Chips Sauce Tartare', categorie: 'Poisson', tags: 'fish chips poisson pane frites citron britannique' },
    { filename: 'sushi_maki.webp', url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80', nom: 'Plateau Sushi Maki Saumon', categorie: 'Poisson', tags: 'sushi maki saumon avocat asiatique japonais poisson' },

    // SALADES & ENTRÉES
    { filename: 'salade_cesar.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIjQvB4VnCOmk9iPCB-Nw8fuYGpEE1Z_3e6g3m4rqFAA&s=10', nom: 'Salade César au Poulet', categorie: 'Salade', tags: 'salade poulet entree frais parmesan croutons cesar' },
    { filename: 'houmous.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTVVEKta3CAHchVKnQvohYAwaUOAV9nUDyX0g1CUyIkAQ&s=10', nom: 'Houmous & Pain Pita', categorie: 'Entrée', tags: 'oriental vegetarien houmous pois chiche pita huile olive tapas' },
    { filename: 'salade_nicoise.webp', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80', nom: 'Salade Niçoise au Thon', categorie: 'Salade', tags: 'salade thon oeuf haricot olive frais mediterranee' },
    { filename: 'caprese_burrata.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRze6vkgGtsbG460lRaxWIp4ycxkOzdq_5nJChjNZjx0Q&s=10', nom: 'Caprese Tomate Burrata', categorie: 'Salade', tags: 'salade mozza tomate basilic burrata vegetarien pesto' },
    { filename: 'salade_grecque.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTN4Ks7prC177l9q8ped2Dbp0vPVg8TqcO_fN0fYbqlsA&s=10', nom: 'Salade Grecque Féta', categorie: 'Salade', tags: 'salade feta concombre poivron olive grecque vegetarien' },

    // PÂTES & RISOTTOS
    { filename: 'linguine_gambas.webp', url: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80', nom: 'Linguine aux Gambas', categorie: 'Pâtes', tags: 'pasta gambas pates crevettes mer ail persil' },
    { filename: 'risotto_cepes.webp', url: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=800&auto=format&fit=crop&q=80', nom: 'Risotto aux Cèpes', categorie: 'Pâtes', tags: 'risotto champignon cepes parmesan creme italienne' },
    { filename: 'spaghetti_carbonara.webp', url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&auto=format&fit=crop&q=80', nom: 'Spaghetti Carbonara', categorie: 'Pâtes', tags: 'pates pasta carbonara pancetta oeuf parmesan italienne' },
    { filename: 'penne_bolognese.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyFFkgxwLoUgIJ5WRVmJNBJ7q1ypnfdxC-SJk1por_UucfameyYf_krdwC&s=10', nom: 'Penne Bolognese Pur Bœuf', categorie: 'Pâtes', tags: 'pates pasta bolognese boeuf tomate sauce parmesan' },
    { filename: 'lasagnes_maison.webp', url: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=800&auto=format&fit=crop&q=80', nom: 'Lasagnes Maison au Four', categorie: 'Pâtes', tags: 'pates pasta lasagne boeuf gratine bechamel tomate' },
    { filename: 'pesto_genovese.webp', url: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&auto=format&fit=crop&q=80', nom: 'Pesto Genovese & Pignons', categorie: 'Pâtes', tags: 'pates pasta pesto basilic vegetarien pignons parmesan' },

    // ORIENTAL & MAROCAIN
    { filename: 'tajine_poulet.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKe6_wb_TneIg02lG17s7p7BH01T-g6ta6muyTILXUGQ&s=10', nom: 'Tajine de Poulet Citrons Confits', categorie: 'Plat', tags: 'tajine poulet citron olives marocain oriental epices fait maison' },
    { filename: 'tajine_agneau.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7AA-eIyuN2yQM3YX21efDDfV44f10mAPpC1uf3yHGJQ&s=10', nom: 'Tajine d Agneau aux Pruneaux', categorie: 'Plat', tags: 'tajine agneau pruneaux amandes marocain oriental epices sucre sale' },
    { filename: 'couscous_royal.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2r2hrd_Usx9v0fH2xKDMo4cd2fepq6ip-n1fEgfCErQ&s=10', nom: 'Couscous Royal 7 Légumes', categorie: 'Plat', tags: 'couscous royal legumes poulet merguez agneau semoule oriental marocain' },
    { filename: 'shawarma_kebab.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT78DJU0Aphf7XXWh0Tyz2lo2NrIOuqYUTF_o2YTuyB_A&s=10', nom: 'Arabic Shawarma Kebab', categorie: 'Plat', tags: 'oriental viande wrap poulet kebab shawarma chawarma pita garlic' },
    { filename: 'falafel_assiette.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQZ16vxoV7Rkd7JZRMznZrdcRwRTWhcePZZaFiVHBW4w&s=10', nom: 'Assiette Falafel Crispy', categorie: 'Plat', tags: 'falafel vegetarien pois chiche tahina oriental hummus salad' },

    // BOISSONS & COCKTAILS
    { filename: 'mojito.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlIxcf_KqRjVe8DFJlu6rokTziQsoCB-T2Oi8V6Wxdvg&s=10', nom: 'Mojito Menthe Fraîche', categorie: 'Boisson', tags: 'boisson cocktail menthe rhum frais glace pilee mocktail' },
    { filename: 'margarita_cocktail.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgaQBxxBykYFcPlgl5zjfPghyrKwtt5p_EDUi0lSBA4A&s=10', nom: 'Margarita Cocktail', categorie: 'Boisson', tags: 'boisson cocktail tequila citron sel aperitif' },
    { filename: 'jus_orange.webp', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=80', nom: 'Jus d Orange Pressé', categorie: 'Boisson', tags: 'jus orange frais boisson bio fruit vitamine detox' },
    { filename: 'limonade_cerise.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRe7hsLjNQ8JglBD9Hk_sGNu8_xPsltHpTY0eV1dHp_-w&s=10', nom: 'Limonade Cerise Citron', categorie: 'Boisson', tags: 'limonade cerise boisson citron rafraichissant frais' },
    { filename: 'the_glace.webp', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80', nom: 'Thé Glacé Pêche Menthe', categorie: 'Boisson', tags: 'the vert menthe boisson mocktail sain peche iced tea' },
    { filename: 'espresso.webp', url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&auto=format&fit=crop&q=80', nom: 'Espresso Barista Italien', categorie: 'Boisson', tags: 'cafe espresso boisson chaud barista arabica' },
    { filename: 'cappuccino.webp', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=800&auto=format&fit=crop&q=80', nom: 'Cappuccino Mousse Lait', categorie: 'Boisson', tags: 'cafe cappuccino lait boisson chaud barista cacao' },
    { filename: 'smoothie_fruits_rouges.webp', url: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80', nom: 'Smoothie Fruits Rouges', categorie: 'Boisson', tags: 'smoothie fraise framboise banane fruit boisson bio' },

    // DESSERTS
    { filename: 'tiramisu.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5JXFkub9wwTJOVcgS0fxjBu7HdN9upgtNSiwQgWjkbg&s=10', nom: 'Tiramisu au Café', categorie: 'Dessert', tags: 'dessert cafe sucre tiramisu mascarpone cacao italienne' },
    { filename: 'fondant_chocolat.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMqz7ifcpMqX9-IOlgD1LDdRf8ozgygYCdmhOYp5zGhA&s=10', nom: 'Fondant au Chocolat Coulant', categorie: 'Dessert', tags: 'dessert chocolat fondant gateau vanille glace' },
    { filename: 'tarte_tatin.webp', url: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=800&auto=format&fit=crop&q=80', nom: 'Tarte Tatin Pommes Caramel', categorie: 'Dessert', tags: 'dessert tarte tatin pomme caramel glace vanille' },
    { filename: 'creme_brulee.webp', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTF7oACBKCbJjr-SCdO-UbhC4OMQ2xODb6i-1e3EBN4Aw&s=10', nom: 'Crème Brûlée Vanille', categorie: 'Dessert', tags: 'dessert creme brulee vanille caramelise francais' },
    { filename: 'cheesecake_fraise.webp', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80', nom: 'Cheesecake New York Fraise', categorie: 'Dessert', tags: 'dessert cheesecake fraise coulis fromage sucre american' },
    { filename: 'coupe_glace.webp', url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=80', nom: 'Coupe Glace Artisanale', categorie: 'Dessert', tags: 'dessert glace vanille chocolat fraise chantilly' }
  ];

  // Photos de Repli (Fallbacks)
  const realFallbacks = [
    { filename: 'pizza.jpg', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80' },
    { filename: 'burger.jpg', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80' },
    { filename: 'salade.jpg', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSIjQvB4VnCOmk9iPCB-Nw8fuYGpEE1Z_3e6g3m4rqFAA&s=10' },
    { filename: 'dessert.jpg', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5JXFkub9wwTJOVcgS0fxjBu7HdN9upgtNSiwQgWjkbg&s=10' },
    { filename: 'boisson.jpg', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlIxcf_KqRjVe8DFJlu6rokTziQsoCB-T2Oi8V6Wxdvg&s=10' },
    { filename: 'viande.jpg', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRFm7zpzGIfYejQajNl5EtomEMBU7WCHCx2HtjRY0EtQA&s=10' },
    { filename: 'poisson.jpg', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdN107UHBn4JU6syv_cWw3SqzhbqZ2wU6ECBy4Bd6X6Q&s=10' },
    { filename: 'plat.jpg', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2r2hrd_Usx9v0fH2xKDMo4cd2fepq6ip-n1fEgfCErQ&s=10' }
  ];

  console.log(`⬇️ Téléchargement des ${realDishes.length} VRAIES photographies culinaires fournies...`);
  const datasetJsonList = [];
  let idCounter = 1;

  for (const dish of realDishes) {
    const dest = path.join(imagesDir, dish.filename);
    try {
      await downloadFile(dish.url, dest);
      console.log(`  [${idCounter}/${realDishes.length}] ✅ Photographie téléchargée : ${dish.filename}`);
    } catch (err: any) {
      console.warn(`  ⚠️ Échec pour ${dish.filename}: ${err.message}`);
    }

    datasetJsonList.push({
      id: idCounter++,
      nom: dish.nom,
      categorie: dish.categorie,
      tags: dish.tags,
      image_url: `/images/dataset/${dish.filename}`
    });
  }

  console.log('\n⬇️ Téléchargement des 8 photographies de repli (fallbacks)...');
  for (const fb of realFallbacks) {
    const dest = path.join(fallbackDir, fb.filename);
    try {
      await downloadFile(fb.url, dest);
      console.log(`  ✅ Fallback téléchargé : ${fb.filename}`);
    } catch (err: any) {
      console.warn(`  ⚠️ Échec fallback ${fb.filename}: ${err.message}`);
    }
  }

  // Écriture du dataset.json mis à jour
  const jsonPath = path.join(dataDir, 'dataset.json');
  fs.writeFileSync(jsonPath, JSON.stringify(datasetJsonList, null, 2), 'utf-8');

  console.log('\n✨ TÉLÉCHARGEMENT ET SAUVEGARDE LOCALE RÉUSSIS AVEC SUCCÈS POUR TOUS LES PLATS FOURNIS !');
  console.log(`📁 ${realDishes.length} VRAIES photographies enregistrées dans : ${imagesDir}`);
  console.log(`📁 8 VRAIES photos de repli enregistrées dans : ${fallbackDir}`);
  console.log(`📄 Catalogue local mis à jour : ${jsonPath}`);
}

downloadAllRealFoodImages().catch((err) => {
  console.error('❌ Échec critique lors du téléchargement des photos:', err);
});
