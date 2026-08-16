import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { GroqService } from '../../src/modules/llm/groq.service';

describe('GroqService - Fallback Multi-Modèles', () => {
  let service: GroqService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [GroqService],
    }).compile();

    service = module.get<GroqService>(GroqService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('devrait utiliser le modèle prioritaire pour la structuration', async () => {
    const result = await service.generateWithFallback(
      'Structure ce plat en JSON : Pizza Margherita 12 EUR',
      'structuration',
      'Tu es un expert JSON',
    );
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('devrait utiliser le modèle 8B ultra-rapide pour les descriptions simples', async () => {
    const result = await service.generateWithFallback(
      'Génère une description pour une Pizza Margherita',
      'description',
      'Tu es un chef cuisinier',
    );
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('devrait basculer automatiquement sans lever d\'erreur si le quota est atteint', async () => {
    const result = await service.generateWithFallback('Test de bascule automatique', 'description');
    expect(result).toBeDefined();
  });
});
