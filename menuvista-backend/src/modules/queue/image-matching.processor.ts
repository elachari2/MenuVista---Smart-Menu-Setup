import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger, Optional } from '@nestjs/common';
import { ImageMatchingService } from '../image-matching/image-matching.service';
import { MenuService } from '../menu/menu.service';

@Processor('image-matching')
@Injectable()
export class ImageMatchingProcessor extends WorkerHost {
  private readonly logger = new Logger(ImageMatchingProcessor.name);

  constructor(
    private readonly matchingService: ImageMatchingService,
    @Optional() private readonly menuService?: MenuService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { menuId, plats } = job.data;
    this.logger.log(`🔄 Traitement du job ${job.id} pour le menu ${menuId}`);

    const results = [];

    for (let i = 0; i < plats.length; i++) {
      const plat = plats[i];
      await job.updateProgress(Math.round(((i + 1) / plats.length) * 100));

      const result = await this.matchingService.matchPlat(
        plat.nom,
        plat.categorie,
        plat.tags,
      );

      if (result && result.imageUrl && this.menuService) {
        await this.menuService.updatePlatImage(plat.id, result.imageUrl);
      }

      results.push({
        platId: plat.id,
        imageUrl: result.imageUrl,
        matched: result.matched,
        score: result.score,
      });
    }

    this.logger.log(
      `✅ ${results.filter((r) => r.matched).length}/${plats.length} plats matchés`,
    );
    return { menuId, results };
  }
}
