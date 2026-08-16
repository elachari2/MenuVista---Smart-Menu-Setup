import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ImageMatchingService } from '../image-matching/image-matching.service';
import { DatasetService } from '../dataset/dataset.service';
import { MenuService } from '../menu/menu.service';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import sharp from 'sharp';

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

  /**
   * Endpoint d'administration pour remplacer ou créer l'image d'un plat par une URL distante ou un lien local.
   * L'image est automatiquement téléchargée, convertie en WebP HD, sauvegardée physiquement dans data/images/
   * et mise à jour (ou créée) dans data/dataset.json.
   */
  @Post('plat/:platId/custom-image')
  async setCustomPlatImage(
    @Param('platId') platId: string,
    @Body() body: { imageUrl: string; nom: string; categorie?: string; tags?: string },
  ) {
    const dishNom = body.nom || 'plat_custom';
    const cleanFilename =
      dishNom
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_') + '.webp';

    const imagesDir = path.resolve(process.cwd(), 'data', 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const localFilePath = path.join(imagesDir, cleanFilename);
    const relativeImageUrl = `/images/dataset/${cleanFilename}`;

    // Télécharger l'image si c'est une URL distante http/https
    if (body.imageUrl && body.imageUrl.startsWith('http')) {
      try {
        await this.downloadImage(body.imageUrl, localFilePath);
      } catch (err: any) {
        console.warn(`[Custom Image] Avertissement téléchargement: ${err?.message || err}`);
      }
    }

    // Upsert dans dataset.json et re-chargement de l'index en mémoire
    const updatedItem = this.datasetService.upsertDishImage(
      dishNom,
      body.categorie || 'Plat',
      body.tags || dishNom.toLowerCase(),
      relativeImageUrl,
    );

    // Mettre à jour l'image du plat dans le menu en mémoire/BDD si menuService est disponible
    if (this.menuService && typeof this.menuService.updatePlatImage === 'function') {
      await this.menuService.updatePlatImage(platId, relativeImageUrl);
    }

    return {
      success: true,
      platId,
      imageUrl: relativeImageUrl,
      datasetItem: updatedItem,
    };
  }

  private async downloadImage(urlStr: string, destPath: string): Promise<void> {
    const buffer = await this.fetchImageBuffer(urlStr);
    try {
      await sharp(buffer).webp({ quality: 90 }).toFile(destPath);
    } catch {
      fs.writeFileSync(destPath, buffer);
    }
  }

  private fetchImageBuffer(urlStr: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const parsedUrl = new URL(urlStr);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const req = protocol.get(
        urlStr,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        },
        (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            let redirectUrl = res.headers.location;
            if (!redirectUrl.startsWith('http')) {
              redirectUrl = new URL(redirectUrl, urlStr).href;
            }
            return this.fetchImageBuffer(redirectUrl).then(resolve).catch(reject);
          }

          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP Status ${res.statusCode}`));
          }

          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        },
      );
      req.on('error', reject);
    });
  }
}
