import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('image-matching') private readonly imageQueue: Queue,
  ) {}

  /**
   * Ajoute un job de matching pour un menu
   */
  async addMatchingJob(menuId: string, plats: any[]): Promise<string> {
    const job = await this.imageQueue.add('match-menu', {
      menuId,
      plats,
    });
    this.logger.log(`✅ Job ${job.id} ajouté pour le menu ${menuId}`);
    return job.id!;
  }
}
