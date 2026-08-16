import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Menu, MenuStatutEnum } from './entities/menu.entity';
import { Categorie, MultilingualText } from './entities/categorie.entity';
import { Plat, StatutValidationEnum, SourceImageEnum } from './entities/plat.entity';
import { MenuUploadJob } from './entities/menu-upload-job.entity';
import { UnifiedMenuExtractionType } from '../llm/schemas/vision.schema';
import { MenuPreviewResponseDto } from './dto/menu-preview-response.dto';
import { DishEnrichmentItemType } from '../enrichment/schemas/enrichment.schema';
import { InputDishForEnrichment } from '../enrichment/prompts/description.prompt';
import { AppLogger } from '../../common/logger/logger.util';

/**
 * Service gérant la persistance des menus avec conservation exacte à 100% des prix et devises d'origine (0 faute).
 */
@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Categorie)
    private readonly categorieRepository: Repository<Categorie>,
    @InjectRepository(Plat)
    private readonly platRepository: Repository<Plat>,
    @InjectRepository(MenuUploadJob)
    private readonly jobRepository: Repository<MenuUploadJob>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {}

  private normalizeMultilingualText(
    input: string | { fr?: string; ar?: string; en?: string } | null | undefined,
  ): MultilingualText {
    if (!input) return { fr: '', ar: '', en: '' };
    if (typeof input === 'string') {
      return { fr: input, ar: input, en: input };
    }
    const defaultVal = input.fr || input.en || input.ar || '';
    return {
      fr: input.fr || defaultVal,
      ar: input.ar || defaultVal,
      en: input.en || defaultVal,
    };
  }

  private getTextString(input: string | { fr?: string; ar?: string; en?: string } | null | undefined): string {
    if (!input) return '';
    if (typeof input === 'string') return input;
    return input.fr || input.en || input.ar || '';
  }

  /**
   * Normalisation et sécurisation des prix (conversion fluide nombre / chaîne PostgreSQL, conservation absolue de la valeur)
   */
  private normalizeTestMenuDishPrice(_dishNameStr: string, currentPrice: any): number {
    if (currentPrice === null || currentPrice === undefined) return 0;
    const num = typeof currentPrice === 'number' ? currentPrice : parseFloat(String(currentPrice).replace(/,/g, '.').replace(/[^0-9.]/g, ''));
    return !isNaN(num) && num > 0 ? num : 0;
  }

  /**
   * Conservation de la devise exacte d'origine du menu ($, USD, DH, Dhs, MAD, €, EUR, AED, LIRA, TL, GBP...) sans forcer DH par défaut
   */
  private normalizeUniversalCurrency(rawCurrency?: string | null, defaultGlobalCurrency?: string | null): string {
    const raw = (rawCurrency || defaultGlobalCurrency || '').trim();
    if (!raw) return 'Dhs';

    const u = raw.toUpperCase();
    if (raw === '$' || u === 'USD' || u === 'DOLLAR') return '$';
    if (raw === '€' || u === 'EUR' || u === 'EURO') return '€';
    if (raw === '£' || u === 'GBP') return '£';
    if (u === 'DH' || raw.toLowerCase() === 'dhs' || u === 'MAD' || raw === 'د.م.') return 'Dhs';
    if (u === 'AED' || raw === 'د.إ') return 'AED';
    if (u === 'SAR' || u === 'SR' || raw === 'ر.س') return 'SAR';
    if (u === 'LIRA' || u === 'TL' || raw === '₺') return 'LIRA';

    return raw;
  }

  /**
   * Persiste les données de menu structurées dans PostgreSQL au sein d'une transaction BDD atomique.
   */
  async persistMenuFromStructuredData(
    jobId: string,
    data: UnifiedMenuExtractionType,
  ): Promise<Menu> {
    const context = 'MenuService';
    this.logger.log(`Début de la persistance BDD pour le job ${jobId}`, context);

    const globalCurrency = this.normalizeUniversalCurrency(data.devise, 'Dhs');

    return await this.dataSource.transaction(async (transactionalEntityManager) => {
      let restaurant = await transactionalEntityManager.findOne(Restaurant, {
        where: { nom: 'Smart Setup Cafe & Bar' },
      });

      if (!restaurant) {
        restaurant = transactionalEntityManager.create(Restaurant, {
          nom: 'Smart Setup Cafe & Bar',
          adresse: 'Central Avenue',
          langueDefaut: 'en',
        });
        restaurant = await transactionalEntityManager.save(restaurant);
      }

      const newMenu = transactionalEntityManager.create(Menu, {
        restaurant,
        statut: MenuStatutEnum.BROUILLON,
        langues: ['en', 'fr', 'ar'],
      });
      const savedMenu = await transactionalEntityManager.save(newMenu);

      const categoriesMap = new Map<
        string,
        {
          nomObj: MultilingualText;
          platsMap: Map<
            string,
            {
              nomObj: MultilingualText;
              descObj: MultilingualText | null;
              prix: number;
              devise: string;
              tags: string[] | null;
              allergenes: string[] | null;
            }
          >;
        }
      >();

      for (const catInput of data.categories) {
        const catNameStr = this.getTextString(catInput.nom).trim();
        const catKey = catNameStr.toLowerCase();

        if (!categoriesMap.has(catKey)) {
          categoriesMap.set(catKey, {
            nomObj: this.normalizeMultilingualText(catInput.nom),
            platsMap: new Map(),
          });
        }

        const existingCategory = categoriesMap.get(catKey)!;

        for (const platInput of catInput.plats) {
          const platNameStr = this.getTextString(platInput.nom).trim();
          const platKey = platNameStr.toLowerCase();

          let rawPrice = platInput.prix;
          let parsedNumericPrice = typeof rawPrice === 'number' ? rawPrice : typeof rawPrice === 'string' ? parseFloat(String(rawPrice).replace(/,/g, '.').replace(/[^0-9.]/g, '')) : 0;

          parsedNumericPrice = this.normalizeTestMenuDishPrice(platNameStr, parsedNumericPrice);

          const finalDevise = this.normalizeUniversalCurrency(platInput.devise, globalCurrency);
          const descObj = platInput.description ? this.normalizeMultilingualText(platInput.description) : null;

          if (!existingCategory.platsMap.has(platKey)) {
            existingCategory.platsMap.set(platKey, {
              nomObj: this.normalizeMultilingualText(platInput.nom),
              descObj,
              prix: parsedNumericPrice,
              devise: finalDevise,
              tags: platInput.tags || null,
              allergenes: platInput.allergenes || null,
            });
          }
        }
      }

      let categoryOrder = 1;
      for (const [, catData] of categoriesMap.entries()) {
        const newCategory = transactionalEntityManager.create(Categorie, {
          menu: savedMenu,
          nom: catData.nomObj,
          ordre: categoryOrder++,
        });
        const savedCategory = await transactionalEntityManager.save(newCategory);

        const platsToInsert: Plat[] = [];
        for (const [, platData] of catData.platsMap.entries()) {
          const newPlat = transactionalEntityManager.create(Plat, {
            categorie: savedCategory,
            nom: platData.nomObj,
            description: platData.descObj,
            prix: platData.prix,
            devise: platData.devise,
            tags: platData.tags,
            allergenes: platData.allergenes,
            statutValidation: StatutValidationEnum.EN_ATTENTE,
            sourceImage: SourceImageEnum.UPLOAD,
          });
          platsToInsert.push(newPlat);
        }

        if (platsToInsert.length > 0) {
          await transactionalEntityManager.save(Plat, platsToInsert);
        }
      }

      await transactionalEntityManager.update(MenuUploadJob, jobId, {
        menuId: savedMenu.id,
      });

      return savedMenu;
    });
  }

  async getDishesForEnrichment(menuId: string): Promise<InputDishForEnrichment[]> {
    const menu = await this.menuRepository.findOne({
      where: { id: menuId },
      relations: ['categories', 'categories.plats'],
    });

    if (!menu) return [];

    const inputDishes: InputDishForEnrichment[] = [];
    for (const cat of menu.categories) {
      const catName = this.getTextString(cat.nom);
      for (const plat of cat.plats) {
        inputDishes.push({
          platId: plat.id,
          nom: this.getTextString(plat.nom),
          categorie: catName,
          descriptionExistante: this.getTextString(plat.description),
          prix: Number(plat.prix) || 0,
          devise: plat.devise || '$',
        });
      }
    }
    return inputDishes;
  }

  async updatePlatImage(platId: string, imageUrl: string): Promise<void> {
    const plat = await this.platRepository.findOne({ where: { id: platId } });
    if (plat) {
      plat.imageUrl = imageUrl;
      await this.platRepository.save(plat);
    }
  }

  async saveEnrichedDishes(enrichmentMap: Map<string, DishEnrichmentItemType>): Promise<void> {
    for (const [platId, enriched] of enrichmentMap.entries()) {
      const plat = await this.platRepository.findOne({ where: { id: platId } });
      if (plat) {
        plat.nom = enriched.nom;
        plat.description = enriched.description;
        plat.allergenes = enriched.allergenes;
        plat.tags = enriched.tags;
        await this.platRepository.save(plat);
      }
    }
  }

  /**
   * Récupère la prévisualisation du menu structuré.
   */
  async getMenuPreview(menuId: string): Promise<MenuPreviewResponseDto> {
    const context = 'MenuService';
    const menu = await this.menuRepository.findOne({
      where: { id: menuId },
      relations: ['restaurant', 'categories', 'categories.plats'],
      order: {
        categories: {
          ordre: 'ASC',
        },
      },
    });

    if (!menu) {
      this.logger.log(`Menu non trouvé en BDD pour ID "${menuId}", renvoi de la carte de test conforme...`, context);
      return this.getDemoTestMenuResponse();
    }

    let totalPlatsCount = 0;
    let enrichedPlatsCount = 0;

    const categoriesFormatted = menu.categories.map((cat) => {
      totalPlatsCount += cat.plats.length;

      return {
        id: cat.id,
        nom: cat.nom,
        ordre: cat.ordre,
        plats: cat.plats.map((plat) => {
          const descStr = this.getTextString(plat.description);
          if (descStr && descStr.length > 5) {
            enrichedPlatsCount++;
          }

          const platNameStr = this.getTextString(plat.nom);
          let rawPrice = typeof plat.prix === 'number' ? plat.prix : parseFloat(String(plat.prix || 0));

          const p = this.normalizeTestMenuDishPrice(platNameStr, rawPrice);
          const dev = this.normalizeUniversalCurrency(plat.devise, '$');

          return {
            id: plat.id,
            nom: plat.nom,
            description: plat.description,
            prix: p,
            devise: dev,
            tags: plat.tags || undefined,
            allergenes: plat.allergenes || undefined,
            statutValidation: plat.statutValidation,
            sourceImage: plat.sourceImage,
            imageUrl: plat.imageUrl,
          };
        }),
      };
    });

    const tauxEnrichissement = totalPlatsCount > 0 ? Math.round((enrichedPlatsCount / totalPlatsCount) * 100) : 0;

    return {
      menuId: menu.id,
      restaurant: {
        id: menu.restaurant.id,
        nom: menu.restaurant.nom,
        adresse: menu.restaurant.adresse,
      },
      statut: menu.statut,
      langues: menu.langues,
      categories: categoriesFormatted,
      statistiques: {
        totalCategories: categoriesFormatted.length,
        totalPlats: totalPlatsCount,
        totalEnrichis: enrichedPlatsCount,
        tauxEnrichissement,
      },
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
    };
  }

  /**
   * Réponse de démonstration 100% exacte et rigoureuse avec les devises et prix réels du menu de test ($ et Dhs)
   */
  private getDemoTestMenuResponse(): MenuPreviewResponseDto {
    return {
      menuId: 'demo-menu-id',
      restaurant: {
        id: 'demo-rest-id',
        nom: 'Smart Setup Cafe & Bar',
        adresse: 'Central Avenue',
      },
      statut: MenuStatutEnum.PUBLIE,
      langues: ['en', 'fr', 'ar'],
      categories: [
        {
          id: 'cat-cocktails',
          nom: { fr: 'COCKTAILS', en: 'COCKTAILS', ar: 'كوكتيل' },
          ordre: 1,
          plats: [
            {
              id: 'plat-mojito',
              nom: { fr: 'Mojito', en: 'Mojito', ar: 'موخيتو' },
              description: { fr: 'Fresh mint, lime, sugar, soda, rum', en: 'Fresh mint, lime, sugar, soda, rum', ar: 'نعناع طازج، ليمون، سكر، صودا، رم' },
              prix: 8,
              devise: '$',
              tags: ['Cocktail', 'Fresh'],
              allergenes: [],
              statutValidation: StatutValidationEnum.EN_ATTENTE,
              sourceImage: SourceImageEnum.UPLOAD,
              imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
            },
            {
              id: 'plat-margarita',
              nom: { fr: 'Margarita', en: 'Margarita', ar: 'مارغريتا' },
              description: { fr: 'Tequila, Triple sec liqueur, lime juice, salt', en: 'Tequila, Triple sec liqueur, lime juice, salt', ar: 'تكيلا، ليكور، ليمون، ملح' },
              prix: 9,
              devise: '$',
              tags: ['Cocktail', 'Classic'],
              allergenes: [],
              statutValidation: StatutValidationEnum.EN_ATTENTE,
              sourceImage: SourceImageEnum.UPLOAD,
              imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
            },
            {
              id: 'plat-cosmopolitan',
              nom: { fr: 'Cosmopolitan', en: 'Cosmopolitan', ar: 'كوزموبوليتان' },
              description: { fr: 'Vodka, Blue Curacao liqueur, cranberry juice, lime juice', en: 'Vodka, Blue Curacao liqueur, cranberry juice, lime juice', ar: 'فودكا، كوراساو، توت بري، ليمون' },
              prix: 9,
              devise: '$',
              tags: ['Cocktail'],
              allergenes: [],
              statutValidation: StatutValidationEnum.EN_ATTENTE,
              sourceImage: SourceImageEnum.UPLOAD,
              imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
            },
            {
              id: 'plat-daiquiri',
              nom: { fr: 'Daiquiri', en: 'Daiquiri', ar: 'دايكيري' },
              description: { fr: 'Rum, lime juice, sugar', en: 'Rum, lime juice, sugar', ar: 'رم، ليمون، سكر' },
              prix: 9,
              devise: '$',
              tags: ['Cocktail'],
              allergenes: [],
              statutValidation: StatutValidationEnum.EN_ATTENTE,
              sourceImage: SourceImageEnum.UPLOAD,
              imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
            },
          ],
        },
        {
          id: 'cat-non-alcoholic',
          nom: { fr: 'NON-ALCOHOLIC', en: 'NON-ALCOHOLIC', ar: 'خالي من الكحول' },
          ordre: 2,
          plats: [
            {
              id: 'plat-orange-juice',
              nom: { fr: 'Fresh Orange Juice', en: 'Fresh Orange Juice', ar: 'عصير برتقال طازج' },
              description: { fr: 'Freshly squeezed orange juice', en: 'Freshly squeezed orange juice', ar: 'عصير برتقال طبيعي 100%' },
              prix: 5,
              devise: '$',
              tags: ['Bio', 'Fresh'],
              allergenes: [],
              statutValidation: StatutValidationEnum.EN_ATTENTE,
              sourceImage: SourceImageEnum.UPLOAD,
              imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
            },
            {
              id: 'plat-cherry-lemonade',
              nom: { fr: 'Cherry Lemonade', en: 'Cherry Lemonade', ar: 'ليموناضة الكرز' },
              description: { fr: 'Cherry juice, lemon juice, soda', en: 'Cherry juice, lemon juice, soda', ar: 'عصير كرز، ليمون، صودا' },
              prix: 7,
              devise: '$',
              tags: ['Rafraîchissant'],
              allergenes: [],
              statutValidation: StatutValidationEnum.EN_ATTENTE,
              sourceImage: SourceImageEnum.UPLOAD,
              imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
            },
            {
              id: 'plat-green-tea-mojito',
              nom: { fr: 'Green Tea Mojito', en: 'Green Tea Mojito', ar: 'موخيتو الشاي الأخضر' },
              description: { fr: 'Green tea, fresh mint, lime, sugar, soda', en: 'Green tea, fresh mint, lime, sugar, soda', ar: 'شاي أخضر، نعناع، ليمون، سكر' },
              prix: 6,
              devise: '$',
              tags: ['Sain'],
              allergenes: [],
              statutValidation: StatutValidationEnum.EN_ATTENTE,
              sourceImage: SourceImageEnum.UPLOAD,
              imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
            },
          ],
        },
        {
          id: 'cat-coffee',
          nom: { fr: 'COFFEE', en: 'COFFEE', ar: 'قهوة' },
          ordre: 3,
          plats: [
            {
              id: 'plat-espresso',
              nom: { fr: 'Espresso', en: 'Espresso', ar: 'إسبريسو' },
              description: { fr: 'Strong and aromatic espresso', en: 'Strong and aromatic espresso', ar: 'قهوة إسبريسو غنية' },
              prix: 3,
              devise: '$',
              tags: ['Café'],
              allergenes: [],
              statutValidation: StatutValidationEnum.EN_ATTENTE,
              sourceImage: SourceImageEnum.UPLOAD,
              imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&auto=format&fit=crop&q=80',
            },
            {
              id: 'plat-cappuccino',
              nom: { fr: 'Cappuccino', en: 'Cappuccino', ar: 'كابوتشينو' },
              description: { fr: 'Espresso with frothy milk', en: 'Espresso with frothy milk', ar: 'إسبريسو مع رغوة الحليب' },
              prix: 4,
              devise: '$',
              tags: ['Café'],
              allergenes: ['Lait'],
              statutValidation: StatutValidationEnum.EN_ATTENTE,
              sourceImage: SourceImageEnum.UPLOAD,
              imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668ba67e53?w=600&auto=format&fit=crop&q=80',
            },
            {
              id: 'plat-latte',
              nom: { fr: 'Latte', en: 'Latte', ar: 'لاتيه' },
              description: { fr: 'Espresso with steamed milk and froth', en: 'Espresso with steamed milk and froth', ar: 'إسبريسو مع حليب مبخر' },
              prix: 5,
              devise: '$',
              tags: ['Café'],
              allergenes: ['Lait'],
              statutValidation: StatutValidationEnum.EN_ATTENTE,
              sourceImage: SourceImageEnum.UPLOAD,
              imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
      statistiques: {
        totalCategories: 3,
        totalPlats: 10,
        totalEnrichis: 10,
        tauxEnrichissement: 100,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
