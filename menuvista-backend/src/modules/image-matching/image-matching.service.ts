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
   * Recherche l'image la plus pertinente pour un plat (Interconnecté avec DatasetService & FTS5)
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

    const cleanNom = (nom || '').trim();
    const cleanCat = (categorie || '').trim();
    const cleanTags = (tags || []).join(' ');
    const searchQuery = `${cleanNom} ${cleanCat} ${cleanTags}`.trim();

    // 1. Interconnexion avec DatasetService (Visuels HD de dataset.json)
    if (this.datasetService) {
      const memoryMatches = this.datasetService.searchFTS5(searchQuery, 3);
      if (memoryMatches && memoryMatches.length > 0) {
        const topMatch = memoryMatches[0];
        this.totalLatencyMs += Date.now() - startTime;
        this.successfulMatches++;
        this.logger.log(`✅ [Dataset Matching] Visuel HD trouvé pour "${cleanNom}" -> ${topMatch.image_url}`);

        return {
          imageUrl: topMatch.image_url,
          matched: true,
          score: 0.95,
          category: topMatch.categorie || categorie || 'plat',
          source: 'fts5_fuse',
          candidateImages: memoryMatches.map((m) => m.image_url),
        };
      }
    }

    // 2. Recherche SQLite FTS5 (dataset.db)
    return new Promise((resolve) => {
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

            // Vérifier si le fichier existe sur disque ou si c'est une URL distante
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

          // 3. Moteur Photographique Gastronomique HD pour chaque catégorie (Cocktails, Cafés, Shawarma, Pizzas, Burgers, etc.)
          this.fallbackMatches++;
          const fallbackRes = this.getFallbackMatch(categorie, nom);
          resolve(fallbackRes);
        },
      );
    });
  }

  /**
   * Moteur Photographique Gastronomique Universel (Cocktails, Cafés, Shawarma, Pizzas, Burgers, etc.)
   */
  private getFallbackMatch(categorie?: string, nom?: string): MatchResult {
    const text = `${categorie || ''} ${nom || ''}`.toLowerCase().trim();

    let imageUrl = '';

    // Cocktails & Alcools
    if (text.includes('mojito') || text.includes('rhum')) {
      imageUrl = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80';
    } else if (text.includes('margarita') || text.includes('tequila')) {
      imageUrl = 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80';
    } else if (text.includes('cosmopolitan') || text.includes('vodka') || text.includes('canneberge')) {
      imageUrl = 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&auto=format&fit=crop&q=80';
    } else if (text.includes('daiquiri')) {
      imageUrl = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80';
    } else if (text.includes('cocktail') || text.includes('spritz') || text.includes('aperol') || text.includes('sangria')) {
      imageUrl = 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80';

    // Boissons Fraîches & Jus
    } else if (text.includes('orange') || text.includes('jus')) {
      imageUrl = 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80';
    } else if (text.includes('lemonade') || text.includes('limonade') || text.includes('citron')) {
      imageUrl = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80';
    } else if (text.includes('tea') || text.includes('thé') || text.includes('iced tea')) {
      imageUrl = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80';

    // Cafés & Boissons Chaudes
    } else if (
      text.includes('espresso') ||
      text.includes('express') ||
      text.includes('cappuccino') ||
      text.includes('latte') ||
      text.includes('café') ||
      text.includes('coffee')
    ) {
      imageUrl = 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&auto=format&fit=crop&q=80';

    // Shawarma, Kebabs & Wraps
    } else if (text.includes('shawarma') || text.includes('chawarma') || text.includes('kebab') || text.includes('wrap') || text.includes('tacos')) {
      imageUrl = 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=600&auto=format&fit=crop&q=80';

    // Burgers
    } else if (text.includes('burger') || text.includes('cheeseburger')) {
      imageUrl = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80';

    // Pizzas
    } else if (text.includes('pizza') || text.includes('calzone') || text.includes('margherita')) {
      imageUrl = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80';

    // Viandes & Steaks
    } else if (text.includes('viande') || text.includes('boeuf') || text.includes('steak') || text.includes('agneau') || text.includes('grillade') || text.includes('mouton') || text.includes('dinde')) {
      imageUrl = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';

    // Poissons & Fruits de Mer
    } else if (text.includes('poisson') || text.includes('saumon') || text.includes('gambas') || text.includes('crevette') || text.includes('mer')) {
      imageUrl = 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80';

    // Salades & Entrées
    } else if (text.includes('salade') || text.includes('entrée') || text.includes('cesar') || text.includes('houmous')) {
      imageUrl = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80';

    // Desserts
    } else if (text.includes('dessert') || text.includes('tiramisu') || text.includes('gâteau') || text.includes('glace')) {
      imageUrl = 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=80';

    } else {
      imageUrl = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80';
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
