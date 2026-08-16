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

  constructor(
    @Optional() private readonly datasetService?: DatasetService,
  ) {
    const dbPath = join(process.cwd(), 'data', 'dataset.db');
    this.db = new sqlite3.Database(dbPath);
    this.logger.log('✅ Base de données SQLite chargée');
  }

  // Rotation map pour faire défiler les visuels lors du re-match
  private rotationMap = new Map<string, number>();

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
   * Recherche l'image la plus pertinente pour un plat (Interconnecté avec DatasetService & FTS5 & IA Pollinations)
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

    // 1. Interconnexion avec DatasetService (Visuels HD diversifiés et ciblés de dataset.json)
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
        this.logger.log(`✅ [Dataset Matching] Visuel HD ciblé pour "${cleanNom}" -> ${matchedVisual.item.image_url}`);

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

    // 2. Recherche SQLite FTS5 (dataset.db)
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

            if (relPath.startsWith('http') || fs.existsSync(fullDiskPath)) {
              const normalizedScore = Math.max(0.5, Math.min(1, 1 - (row.score || 0) / 10));
              this.successfulMatches++;
              const imageUrl = relPath.startsWith('http') ? relPath : `/images/dataset/${relPath}`;

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

          // 3. Moteur Photographique Gastronomique HD + IA Pollinations pour visuels 100% uniques
          this.fallbackMatches++;
          const fallbackRes = this.getFallbackMatch(categorie, nom, rotateOffset);
          resolve(fallbackRes);
        },
      );
    });
  }

  /**
   * Moteur Photographique Gastronomique Universel avec Génération IA Culinaire Dynamique
   */
  private getFallbackMatch(categorie?: string, nom?: string, rotateOffset: number = 0): MatchResult {
    const cleanNom = (nom || '').trim();
    const text = `${categorie || ''} ${cleanNom}`.toLowerCase().trim();

    // Hachage du nom pour garantir une sélection d'image unique par plat
    let hash = 0;
    for (let i = 0; i < cleanNom.length; i++) {
      hash = (hash << 5) - hash + cleanNom.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash) + rotateOffset;

    // Pools de photographies gastronomiques HD par catégorie
    const pizzaPool = [
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1573821663912-6df460f9c684?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?w=600&auto=format&fit=crop&q=80',
    ];

    const burgerPool = [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
    ];

    const pastaPool = [
      'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1621996346565-e3d5d6281273?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&auto=format&fit=crop&q=80',
    ];

    const saladPool = [
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a8f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    ];

    const dessertPool = [
      'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=600&auto=format&fit=crop&q=80',
    ];

    let imageUrl = '';

    if (text.includes('pizza') || text.includes('calzone') || text.includes('margherita')) {
      imageUrl = pizzaPool[seed % pizzaPool.length];
    } else if (text.includes('burger') || text.includes('cheeseburger')) {
      imageUrl = burgerPool[seed % burgerPool.length];
    } else if (text.includes('pâte') || text.includes('pasta') || text.includes('spaghetti') || text.includes('penne') || text.includes('linguine') || text.includes('lasagne')) {
      imageUrl = pastaPool[seed % pastaPool.length];
    } else if (text.includes('salade') || text.includes('entrée') || text.includes('cesar') || text.includes('houmous')) {
      imageUrl = saladPool[seed % saladPool.length];
    } else if (text.includes('dessert') || text.includes('tiramisu') || text.includes('gâteau') || text.includes('glace') || text.includes('tarte')) {
      imageUrl = dessertPool[seed % dessertPool.length];
    } else {
      // Génération d'une image culinaire IA unique via l'API Pollinations pour tout plat personnalisé
      const promptParam = encodeURIComponent(`delicious gourmet restaurant food dish ${cleanNom || categorie || 'meal'}`);
      imageUrl = `https://pollinations.ai/p/${promptParam}?width=600&height=400&nologo=true&seed=${seed}`;
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
