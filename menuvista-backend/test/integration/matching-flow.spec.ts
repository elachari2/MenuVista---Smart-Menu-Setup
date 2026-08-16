import { Test, TestingModule } from '@nestjs/testing';
import { ImageMatchingService } from '../../src/modules/image-matching/image-matching.service';

describe('Matching Flow Integration Test', () => {
  let matchingService: ImageMatchingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageMatchingService],
    }).compile();

    matchingService = module.get<ImageMatchingService>(ImageMatchingService);
  });

  it('devrait associer une image à chaque plat d un menu extrait', async () => {
    const extractedPlats = [
      { id: '1', nom: 'pizza', categorie: 'pizza', tags: ['italienne'] },
      { id: '2', nom: 'cheeseburger', categorie: 'burger', tags: ['viande'] },
      { id: '3', nom: 'Spécialité Maison Inconnue', categorie: 'plat' },
    ];

    const results = [];
    for (const plat of extractedPlats) {
      const res = await matchingService.matchPlat(plat.nom, plat.categorie, plat.tags);
      results.push(res);
    }

    expect(results.length).toBe(3);
    results.forEach((res) => {
      expect(res.imageUrl).toBeDefined();
      expect(typeof res.imageUrl).toBe('string');
    });
  });

  it('devrait utiliser des URLs de dataset ou de fallback valides', async () => {
    const matchSuccess = await matchingService.matchPlat('pizza');
    expect(matchSuccess.imageUrl).toBeDefined();
    expect(typeof matchSuccess.imageUrl).toBe('string');

    const matchFallback = await matchingService.matchPlat('Plat Inexistant 99');
    expect(matchFallback.imageUrl).toBeDefined();
    expect(typeof matchFallback.imageUrl).toBe('string');
  });

  it('devrait répondre en moins de 100 ms par plat (performance FTS5)', async () => {
    const samplePlats = Array.from({ length: 10 }, (_, i) => ({
      nom: `pizza`,
      categorie: 'pizza',
    }));

    const startTime = Date.now();
    for (const plat of samplePlats) {
      await matchingService.matchPlat(plat.nom, plat.categorie);
    }
    const duration = Date.now() - startTime;
    const avgTimePerPlat = duration / samplePlats.length;

    expect(avgTimePerPlat).toBeLessThan(100);
  });
});
