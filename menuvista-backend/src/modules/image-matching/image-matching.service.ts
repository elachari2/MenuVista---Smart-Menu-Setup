import { Injectable, Logger, Optional } from '@nestjs/common';
import * as sqlite3 from 'sqlite3';
import { join } from 'path';
import * as fs from 'fs';
import { DatasetService } from '../dataset/dataset.service';
import { MatchResult, MatchingStats } from './interfaces/match-result.interface';

export interface PlatMatchInput {
  nom: string;
  categorie?: string;
  tags?: string[];
}

/**
 * Service de Matching d'Images 100% Local (Sans aucune dépendance ou API externe).
 */
@Injectable()
export class ImageMatchingService {
  private readonly logger = new Logger(ImageMatchingService.name);
  private readonly db: sqlite3.Database;

  // Métriques d'administration
  private totalRequests = 0;
  private successfulMatches = 0;
  private fallbackMatches = 0;
  private cacheHits = 0;
  private totalLatencyMs = 0;

  // Map de rotation pour faire défiler les visuels locaux lors du re-match
  private rotationMap = new Map<string, number>();

  constructor(
    @Optional() private readonly datasetService?: DatasetService,
  ) {
    const dbPath = join(process.cwd(), 'data', 'dataset.db');
    this.db = new sqlite3.Database(dbPath);
    this.logger.log('✅ Base de données SQLite locale chargée');
  }

  /**
   * Métriques pour l'administration
   */
  getStats(): MatchingStats {
    const avgLatency =
      this.totalRequests > 0
        ? Math.round(this.totalLatencyMs / this.totalRequests)
        : 0;
    const matchRate =
      this.totalRequests > 0
        ? Math.round((this.successfulMatches / this.totalRequests) * 100)
        : 0;

    return {
      totalRequests: this.totalRequests,
      totalMatchingRequests: this.totalRequests,
      successfulMatches: this.successfulMatches,
      fallbackMatches: this.fallbackMatches,
      cacheHits: this.cacheHits,
      averageLatencyMs: avgLatency,
      avgLatencyMs: avgLatency,
      matchRatePercentage: matchRate,
    };
  }

  /**
   * Recherche l'image la plus pertinente pour un plat (100% Locale via DatasetService & SQLite FTS5)
   */
  async matchPlat(
    input: string | PlatMatchInput,
    categorieOrIgnoreCache?: string | boolean,
    tagsOrIgnoreCache?: string[] | boolean,
    ignoreCacheParam: boolean = false,
  ): Promise<MatchResult> {
    const startTime = Date.now();
    this.totalRequests++;

    let nom: string;
    let categorie: string | undefined;
    let tags: string[] | undefined;
    let ignoreCache = false;

    if (typeof input === 'object' && input !== null) {
      nom = input.nom;
      categorie = input.categorie;
      tags = input.tags;
    } else {
      nom = input;
      if (typeof categorieOrIgnoreCache === 'string') {
        categorie = categorieOrIgnoreCache;
      }
      if (Array.isArray(tagsOrIgnoreCache)) {
        tags = tagsOrIgnoreCache;
      }
    }

    if (typeof categorieOrIgnoreCache === 'boolean') {
      ignoreCache = categorieOrIgnoreCache;
    } else if (typeof tagsOrIgnoreCache === 'boolean') {
      ignoreCache = tagsOrIgnoreCache;
    } else if (typeof ignoreCacheParam === 'boolean') {
      ignoreCache = ignoreCacheParam;
    }

    const cleanNom = (nom || '').trim();
    const cleanCat = (categorie || '').trim();
    const cleanTags = (tags || []);

    // Gestion de l'offset de rotation pour la réassociation
    let rotateOffset = this.rotationMap.get(cleanNom) || 0;
    if (ignoreCache) {
      rotateOffset += 1;
      this.rotationMap.set(cleanNom, rotateOffset);
    }

    // 1. Interconnexion avec DatasetService (Visuels HD locaux de dataset.json)
    if (this.datasetService) {
      const matchedVisual = this.datasetService.matchDishVisual(
        cleanNom,
        cleanCat,
        cleanTags,
        rotateOffset,
      );

      if (matchedVisual && matchedVisual.item) {
        this.totalLatencyMs += Date.now() - startTime;
        this.successfulMatches++;
        this.logger.log(`✅ [Dataset Matching Local] Visuel trouvé pour "${cleanNom}" -> ${matchedVisual.item.image_url}`);

        return {
          imageUrl: matchedVisual.item.image_url,
          matched: true,
          score: 0.95,
          category: matchedVisual.item.categorie || categorie || 'plat',
          source: 'fts5_fuse',
          candidateImages: matchedVisual.candidates.map((m) => m.image_url),
        };
      }
    }

    // 2. Recherche SQLite FTS5 locale (dataset.db)
    return new Promise((resolve) => {
      const searchQuery = `${cleanNom} ${cleanCat} ${cleanTags.join(' ')}`.trim();
      const sanitizeToken = (t: string) => t.replace(/[^\w\s]/gi, ' ').trim();
      const tokens = sanitizeToken(searchQuery)
        .split(/\s+/)
        .filter((t) => t.length > 1);

      const query = tokens.length > 0 ? tokens.join(' OR ') : cleanNom;

      this.db.get(
        `SELECT image_path, categorie, rank as score 
         FROM image_index 
         WHERE image_index MATCH ? 
         ORDER BY rank LIMIT 1`,
        [query],
        (err, row: any) => {
          this.totalLatencyMs += Date.now() - startTime;

          if (!err && row && row.image_path) {
            const relPath = row.image_path;
            const fullDiskPath = join(process.cwd(), 'data', 'images', relPath);

            if (fs.existsSync(fullDiskPath) || relPath.startsWith('/images/')) {
              const normalizedScore = Math.max(0.5, Math.min(1, 1 - (row.score || 0) / 10));
              this.successfulMatches++;
              const imageUrl = relPath.startsWith('/') ? relPath : `/images/dataset/${relPath}`;

              resolve({
                imageUrl,
                matched: true,
                score: normalizedScore,
                category: row.categorie || categorie || 'plat',
                source: 'fts5_fuse',
                candidateImages: [imageUrl],
              });
              return;
            }
          }

          // 3. Fallback Moteur Photographique 100% Local
          this.fallbackMatches++;
          const fallbackRes = this.getFallbackMatch(categorie, nom, rotateOffset);
          resolve(fallbackRes);
        },
      );
    });
  }

  /**
   * Moteur Photographique Gastronomique 100% Local (sans aucune URL externe)
   */
  private getFallbackMatch(categorie?: string, nom?: string, rotateOffset: number = 0): MatchResult {
    const cleanNom = (nom || '').trim();
    const text = `${categorie || ''} ${cleanNom}`.toLowerCase().trim();

    // Hachage du nom pour sélectionner une image locale unique
    let hash = 0;
    for (let i = 0; i < cleanNom.length; i++) {
      hash = (hash << 5) - hash + cleanNom.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash) + rotateOffset;

    // Pools de photographies locales HD du projet (fichiers disques réels)
    const pizzaPool = [
      '/images/dataset/margherita.webp',
      '/images/dataset/4fromages.webp',
      '/images/fallback/pizza.jpg',
    ];

    const burgerPool = [
      '/images/dataset/cheeseburger.webp',
      '/images/dataset/poulet_burger.webp',
      '/images/fallback/burger.jpg',
    ];

    const meatPool = [
      '/images/dataset/agneau_confit.webp',
      '/images/dataset/tartare_boeuf.webp',
      '/images/fallback/viande.jpg',
    ];

    const fishPool = [
      '/images/dataset/saumon_roti.webp',
      '/images/dataset/crevettes_pilpil.webp',
      '/images/fallback/poisson.jpg',
    ];

    const saladPool = [
      '/images/dataset/salade_cesar.webp',
      '/images/dataset/houmous.webp',
      '/images/fallback/salade.jpg',
    ];

    const pastaPool = [
      '/images/dataset/linguine_gambas.webp',
      '/images/dataset/risotto_cepes.webp',
      '/images/fallback/plat.jpg',
    ];

    const beveragePool = [
      '/images/dataset/mojito.webp',
      '/images/dataset/margarita_cocktail.webp',
      '/images/fallback/boisson.jpg',
    ];

    const dessertPool = [
      '/images/dataset/tiramisu.webp',
      '/images/fallback/dessert.jpg',
    ];

    let imageUrl = '';

    if (text.includes('pizza') || text.includes('calzone') || text.includes('margherita')) {
      imageUrl = pizzaPool[seed % pizzaPool.length];
    } else if (text.includes('burger') || text.includes('cheeseburger')) {
      imageUrl = burgerPool[seed % burgerPool.length];
    } else if (text.includes('viande') || text.includes('boeuf') || text.includes('steak') || text.includes('agneau')) {
      imageUrl = meatPool[seed % meatPool.length];
    } else if (text.includes('poisson') || text.includes('saumon') || text.includes('gambas') || text.includes('crevette')) {
      imageUrl = fishPool[seed % fishPool.length];
    } else if (text.includes('pâte') || text.includes('pasta') || text.includes('spaghetti') || text.includes('risotto') || text.includes('linguine')) {
      imageUrl = pastaPool[seed % pastaPool.length];
    } else if (text.includes('salade') || text.includes('entrée') || text.includes('cesar') || text.includes('houmous')) {
      imageUrl = saladPool[seed % saladPool.length];
    } else if (text.includes('boisson') || text.includes('cocktail') || text.includes('mojito') || text.includes('jus') || text.includes('café')) {
      imageUrl = beveragePool[seed % beveragePool.length];
    } else if (text.includes('dessert') || text.includes('tiramisu') || text.includes('gâteau') || text.includes('glace')) {
      imageUrl = dessertPool[seed % dessertPool.length];
    } else {
      imageUrl = '/images/fallback/plat.jpg';
    }

    return {
      imageUrl,
      matched: true,
      score: 0.85,
      category: categorie || 'plat',
      source: 'fallback',
      candidateImages: [imageUrl],
    };
  }
}
