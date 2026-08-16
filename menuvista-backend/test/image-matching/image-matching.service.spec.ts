import { Test, TestingModule } from '@nestjs/testing';
import { ImageMatchingService } from '../../src/modules/image-matching/image-matching.service';
import { DatasetService } from '../../src/modules/dataset/dataset.service';

describe('ImageMatchingService', () => {
  let service: ImageMatchingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageMatchingService,
        {
          provide: DatasetService,
          useValue: {
            getAllItems: () => [
              { id: 1, nom: 'Pizza Margherita', categorie: 'Pizza', tags: 'italienne vegetarien', image_url: '/images/dataset/margherita.webp' },
              { id: 2, nom: 'Cheeseburger Pur Boeuf', categorie: 'Burger', tags: 'viande burger', image_url: '/images/dataset/cheeseburger.webp' },
              { id: 3, nom: 'Mojito Menthe Fraîche', categorie: 'Boisson', tags: 'cocktail menthe', image_url: '/images/dataset/mojito.webp' },
            ],
            searchFTS5: (query: string) => {
              if (query.toLowerCase().includes('margherita')) {
                return [{ id: 1, nom: 'Pizza Margherita', categorie: 'Pizza', tags: 'italienne', image_url: '/images/dataset/margherita.webp' }];
              }
              return [];
            },
            getTotalCount: () => 3,
          },
        },
      ],
    }).compile();

    service = module.get<ImageMatchingService>(ImageMatchingService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('devrait associer une image valide avec un score > 0.6', async () => {
    const res = await service.matchPlat({ nom: 'Pizza Margherita', categorie: 'Pizza' });
    expect(res).toBeDefined();
    expect(res.imageUrl).toContain('margherita.webp');
    expect(res.score).toBeGreaterThan(0.6);
    expect(res.matched).toBe(true);
  });

  it('devrait basculer sur l\'image de repli si le score est inférieur au seuil', async () => {
    const res = await service.matchPlat({ nom: 'Plat Inconnu 123', categorie: 'Pizza' });
    expect(res).toBeDefined();
    expect(res.imageUrl).toBeDefined();
    expect(res.matched).toBe(true);
  });

  it('devrait calculer des métriques d\'administration', () => {
    const stats = service.getStats();
    expect(stats).toBeDefined();
    expect(stats.totalMatchingRequests).toBeGreaterThanOrEqual(0);
    expect(stats.averageLatencyMs).toBeLessThan(100);
  });
});
