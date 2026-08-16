import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

export interface DatasetItem {
  id: number;
  nom: string;
  categorie: string;
  tags: string;
  image_url: string;
}

/**
 * Service d'indexation du Dataset Gastronomique Universel MenuVista.
 */
@Injectable()
export class DatasetService implements OnModuleInit {
  private readonly logger = new Logger(DatasetService.name);
  private items: DatasetItem[] = [];

  onModuleInit() {
    this.loadDataset();
  }

  /**
   * Charge le Dataset Gastronomique Universel depuis data/dataset.json avec indexation rapide en mémoire.
   */
  public loadDataset(): void {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const jsonPath =
      process.env.DATASET_JSON_PATH || path.join(dataDir, 'dataset.json');

    if (fs.existsSync(jsonPath)) {
      try {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        this.items = JSON.parse(raw);
        this.logger.log(`[Dataset Gastronomique] ${this.items.length} visuels HD chargés en mémoire.`);
      } catch (err: any) {
        this.logger.warn(`[Dataset Gastronomique] Échec lecture dataset.json: ${err?.message || err}`);
        this.items = [];
      }
    } else {
      this.logger.warn(`[Dataset Gastronomique] dataset.json non trouvé à : ${jsonPath}`);
      this.items = [];
    }
  }

  /**
   * Récupère tous les enregistrements du dataset pour alimenter le moteur de matching
   */
  getAllItems(): DatasetItem[] {
    if (this.items.length === 0) {
      this.loadDataset();
    }
    return this.items;
  }

  /**
   * Recherche par mots clés en mémoire (Simulant la recherche FTS5 sur le dataset gastronomique)
   */
  searchFTS5(query: string, limit: number = 10): DatasetItem[] {
    const cleanTokens = query
      .toLowerCase()
      .replace(/[^\w\s]/gi, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    if (cleanTokens.length === 0) return [];

    const scored = this.items
      .map((item) => {
        const haystack = `${item.nom} ${item.categorie} ${item.tags}`.toLowerCase();
        let matches = 0;
        cleanTokens.forEach((token) => {
          if (haystack.includes(token)) matches++;
        });

        const score = matches / cleanTokens.length;
        return { item, score };
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.item);
  }

  /**
   * Nombre total de visuels indexés dans le dataset local
   */
  getTotalCount(): number {
    return this.items.length;
  }
}
