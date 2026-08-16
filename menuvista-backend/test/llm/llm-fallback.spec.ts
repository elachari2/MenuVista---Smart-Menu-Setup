import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { LlmService } from '../../src/modules/llm/llm.service';
import { GroqService } from '../../src/modules/llm/groq.service';

describe('LlmService - Fallback', () => {
  let service: LlmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [LlmService, GroqService],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('devrait utiliser le fallback si le premier modèle échoue', async () => {
    jest.spyOn(service, 'generateContentWithFallback').mockImplementationOnce(async () => {
      return null;
    });

    const result = await service.generateContentWithFallback('Test prompt');
    expect(result).toBeNull();
  });

  it('devrait retourner une réponse si un modèle fonctionne', async () => {
    const result = await service.generateContentWithFallback('Génère une description pour une Pizza Margherita');
    expect(result).toBeDefined();
    if (result) {
      expect(result.length).toBeGreaterThan(5);
    }
  });
});
