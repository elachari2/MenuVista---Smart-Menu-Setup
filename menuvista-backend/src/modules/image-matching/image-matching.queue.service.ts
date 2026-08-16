import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ImageMatchingQueueService {
  private readonly logger = new Logger(ImageMatchingQueueService.name);

  constructor(@InjectQueue('image-matching') private readonly matchingQueue: Queue) {}

  /**
   * Envoie un job d'association de visuels dans la file d'attente Redis / BullMQ
   */
  async addMatchingJob(menuId: string, plats: Array<{ id: string; nom: string; categorie: string; tags?: string[] }>): Promise<string> {
    try {
      const job = await this.matchingQueue.add(
        'match-menu-images',
        { menuId, plats },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
        },
      );

      this.logger.log(`[Queue] Job d'association d'images ajouté à la file BullMQ (Job ID: ${job.id}, Menu ID: ${menuId})`);
      return String(job.id);
    } catch (err: any) {
      this.logger.error(`[Queue] ❌ Échec ajout job BullMQ: ${err?.message || err}`);
      return '';
    }
  }
}
