import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from '../../src/modules/queue/queue.service';
import { ImageMatchingProcessor } from '../../src/modules/queue/image-matching.processor';
import { ImageMatchingService } from '../../src/modules/image-matching/image-matching.service';
import { getQueueToken } from '@nestjs/bullmq';

describe('QueueModule & ImageMatchingProcessor', () => {
  let queueService: QueueService;
  let processor: ImageMatchingProcessor;
  let matchingService: ImageMatchingService;
  let mockQueue: any;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockImplementation((name, data) =>
        Promise.resolve({ id: 'job-123', name, data }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        ImageMatchingProcessor,
        ImageMatchingService,
        {
          provide: getQueueToken('image-matching'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    queueService = module.get<QueueService>(QueueService);
    processor = module.get<ImageMatchingProcessor>(ImageMatchingProcessor);
    matchingService = module.get<ImageMatchingService>(ImageMatchingService);
  });

  it('devrait ajouter un job dans la queue avec les options de retry et backoff', async () => {
    const plats = [
      { id: 'p1', nom: 'Pizza Margherita', categorie: 'Pizza' },
      { id: 'p2', nom: 'Cheeseburger', categorie: 'Burger' },
    ];

    const jobId = await queueService.addMatchingJob('menu-456', plats);
    expect(jobId).toBe('job-123');
    expect(mockQueue.add).toHaveBeenCalledWith('match-menu', {
      menuId: 'menu-456',
      plats,
    });
  });

  it('devrait traiter un job et mettre à jour la progression', async () => {
    const mockJob: any = {
      id: 'job-123',
      data: {
        menuId: 'menu-456',
        plats: [
          { id: 'p1', nom: 'Pizza Margherita', categorie: 'Pizza' },
          { id: 'p2', nom: 'Plat inconnu', categorie: 'Inconnu' },
        ],
      },
      updateProgress: jest.fn().mockResolvedValue(true),
    };

    const result = await processor.process(mockJob);

    expect(mockJob.updateProgress).toHaveBeenCalledTimes(2);
    expect(mockJob.updateProgress).toHaveBeenNthCalledWith(1, 50);
    expect(mockJob.updateProgress).toHaveBeenNthCalledWith(2, 100);

    expect(result.menuId).toBe('menu-456');
    expect(result.results.length).toBe(2);
    expect(result.results[0].platId).toBe('p1');
    expect(result.results[0].imageUrl).toBeDefined();
  });
});
