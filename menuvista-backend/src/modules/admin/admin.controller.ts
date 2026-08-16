import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ImageMatchingService } from '../image-matching/image-matching.service';
import { DatasetService } from '../dataset/dataset.service';
import { MenuService } from '../menu/menu.service';

@Controller('api/v1/admin')
export class AdminController {
  constructor(
    private readonly matchingService: ImageMatchingService,
    private readonly datasetService: DatasetService,
    private readonly menuService: MenuService,
  ) {}

  @Get('matching-stats')
  getMatchingStats() {
    const matchingStats = this.matchingService.getStats();
    const datasetCount = this.datasetService.getTotalCount();

    return {
      success: true,
      timestamp: new Date().toISOString(),
      dataset: {
        totalIndexedImages: datasetCount,
        storageType: 'Local JSON + Fuse.js Indexer',
      },
      metrics: matchingStats,
    };
  }

  /**
   * Endpoint d'administration pour réassocier un visuel à un plat spécifique
   */
  @Post('plat/:platId/re-match')
  async rematchPlat(
    @Param('platId') platId: string,
    @Body() body: { nom: string; categorie: string; tags?: string[] },
  ) {
    const result = await this.matchingService.matchPlat(
      {
        nom: body.nom,
        categorie: body.categorie,
        tags: body.tags || [],
      },
      true, // Ignorer le cache mémoire pour obtenir une nouvelle image aléatoire du Top-3
    );

    if (this.menuService && typeof this.menuService.updatePlatImage === 'function') {
      await this.menuService.updatePlatImage(platId, result.imageUrl);
    }

    return {
      success: true,
      platId,
      imageUrl: result.imageUrl,
      score: result.score,
      matched: result.matched,
      source: result.source,
      candidateImages: result.candidateImages || [],
    };
  }
}
