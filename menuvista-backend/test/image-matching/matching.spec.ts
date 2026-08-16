import { Test, TestingModule } from '@nestjs/testing';
import { ImageMatchingService } from '../../src/modules/image-matching/image-matching.service';

describe('ImageMatchingService', () => {
  let service: ImageMatchingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageMatchingService],
    }).compile();

    service = module.get<ImageMatchingService>(ImageMatchingService);
  });

  it('devrait trouver une correspondance pour Pizza', async () => {
    const result = await service.matchPlat('pizza');
    expect(result.imageUrl).toBeDefined();
    expect(result.matched).toBe(true);
    expect(result.score).toBeGreaterThan(0.3);
  });

  it('devrait effectuer une recherche avec catégorie et tags', async () => {
    const result = await service.matchPlat('cheeseburger', 'burger', ['viande', 'bacon']);
    expect(result.imageUrl).toBeDefined();
    expect(result.category).toBeDefined();
  });

  it('devrait retourner un score normalisé entre 0 et 1', async () => {
    const result = await service.matchPlat('pizza');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('devrait déclencher un fallback automatique si le score est insuffisant', async () => {
    const result = await service.matchPlat('plat_totalement_inconnu_xyz_99');
    expect(result.matched).toBe(true);
    expect(result.score).toBeGreaterThan(0);
    expect(result.imageUrl).toBeDefined();
  });

  it('devrait retourner un fallback par catégorie pour pizza', async () => {
    const result = await service.matchPlat('plat_inconnu_xyz', 'pizza');
    expect(result.matched).toBe(true);
    expect(result.imageUrl).toContain('http');
    expect(result.category).toBe('pizza');
  });

  it('devrait retourner un fallback générique pour une catégorie inconnue', async () => {
    const result = await service.matchPlat('plat_inconnu_xyz', 'inconnu');
    expect(result.matched).toBe(true);
    expect(result.imageUrl).toBeDefined();
  });
});
