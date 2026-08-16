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
   * Calcul d'un hachage numérique déterministe pour une chaîne
   */
  private hashString(str: string): number {
    let hash = 0;
    const s = (str || '').toLowerCase().trim();
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
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

    const normQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const scored = this.items
      .map((item) => {
        const normItemNom = item.nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const haystack = `${item.nom} ${item.categorie} ${item.tags}`.toLowerCase();
        let matches = 0;
        cleanTokens.forEach((token) => {
          if (haystack.includes(token)) matches++;
        });

        let bonus = 0;
        if (normItemNom === normQuery) bonus = 10;
        else if (normItemNom.includes(normQuery) || normQuery.includes(normItemNom)) bonus = 3;

        const score = (matches / cleanTokens.length) + bonus;
        return { item, score };
      })
      .filter((res) => res.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.item);
  }

  /**
   * Recherche et sélectionne un visuel HD unique pour un plat donné avec support de la rotation
   */
  matchDishVisual(dishNom: string, category?: string, tags: string[] = [], rotateOffset: number = 0): { item: DatasetItem; candidates: DatasetItem[] } | null {
    if (this.items.length === 0) {
      this.loadDataset();
    }

    const cleanNom = (dishNom || '').trim();
    if (!cleanNom) return null;

    const normalizedTarget = cleanNom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // 1. Recherche par correspondance EXACTE du nom de plat (Priorité Absolue)
    const exactIndex = this.items.findIndex((item) => {
      const norm = item.nom
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return norm === normalizedTarget;
    });

    if (exactIndex !== -1 && rotateOffset === 0) {
      return {
        item: this.items[exactIndex],
        candidates: [this.items[exactIndex]],
      };
    }

    // 2. Sinon, recherche par tokens FTS5
    const searchQuery = `${cleanNom} ${category || ''} ${tags.join(' ')}`.trim();
    const candidates = this.searchFTS5(searchQuery, 10);

    if (candidates.length === 0) {
      if (exactIndex !== -1) {
        return {
          item: this.items[exactIndex],
          candidates: [this.items[exactIndex]],
        };
      }
      return null;
    }

    if (exactIndex !== -1) {
      const exactItem = this.items[exactIndex];
      const filtered = candidates.filter((c) => c.id !== exactItem.id);
      candidates.unshift(exactItem);
    }

    const baseHash = this.hashString(cleanNom);
    const index = (baseHash + rotateOffset) % candidates.length;
    const selectedItem = candidates[index];

    return {
      item: selectedItem,
      candidates,
    };
  }

  /**
   * Ajoute ou met à jour une entrée dans dataset.json avec une nouvelle image locale.
   */
  public upsertDishImage(
    nom: string,
    categorie: string,
    tags: string,
    imageUrl: string,
  ): DatasetItem {
    const cleanNom = nom.trim();
    const normalizedTarget = cleanNom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const existingIndex = this.items.findIndex((item) => {
      const norm = item.nom
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return norm === normalizedTarget;
    });

    let resultItem: DatasetItem;

    if (existingIndex !== -1) {
      // Mise à jour de l'image existante
      this.items[existingIndex].image_url = imageUrl;
      if (categorie) this.items[existingIndex].categorie = categorie;
      if (tags) this.items[existingIndex].tags = tags;
      resultItem = this.items[existingIndex];
      this.logger.log(`[Dataset Upsert] Image mise à jour pour '${cleanNom}': ${imageUrl}`);
    } else {
      // Création d'un nouveau plat dans dataset.json
      const nextId =
        this.items.length > 0 ? Math.max(...this.items.map((i) => i.id)) + 1 : 1;
      resultItem = {
        id: nextId,
        nom: cleanNom,
        categorie: categorie || 'Plat',
        tags: tags || cleanNom.toLowerCase(),
        image_url: imageUrl,
      };
      this.items.push(resultItem);
      this.logger.log(`[Dataset Upsert] Nouveau plat ajouté au dataset '${cleanNom}': ${imageUrl}`);
    }

    // Persistance sur disque dans data/dataset.json
    this.saveDataset();

    return resultItem;
  }

  /**
   * Sauvegarde le dataset actuel dans data/dataset.json
   */
  private saveDataset(): void {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const jsonPath =
      process.env.DATASET_JSON_PATH || path.join(dataDir, 'dataset.json');
    try {
      fs.writeFileSync(jsonPath, JSON.stringify(this.items, null, 2), 'utf-8');
      this.loadDataset();
      this.logger.log(`[Dataset Gastronomique] dataset.json sauvegardé sur disque avec ${this.items.length} éléments.`);
    } catch (err: any) {
      this.logger.error(`[Dataset Gastronomique] Échec écriture dataset.json: ${err?.message || err}`);
    }
  }

  /**
   * Nombre total de visuels indexés dans le dataset local
   */
  getTotalCount(): number {
    return this.items.length;
  }
}
