import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Menu } from './menu.entity';
import { Plat } from './plat.entity';

/** Interface pour les champs multilingues (Arabe, Français, Anglais) */
export interface MultilingualText {
  ar?: string;
  fr?: string;
  en?: string;
}

/**
 * Entité TypeORM représentant une catégorie de menu (ex: Entrées, Plats, Desserts).
 */
@Entity('categories')
export class Categorie {
  /** Identifiant unique de la catégorie (UUID v4) */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Nom multilingue stocké au format JSONB */
  @Column({ type: 'jsonb' })
  nom!: MultilingualText;

  /** Ordre d'affichage de la catégorie */
  @Column({ type: 'integer', default: 0 })
  ordre!: number;

  /** Menu parent */
  @ManyToOne(() => Menu, (menu) => menu.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu!: Menu;

  /** Liste des plats appartenant à cette catégorie */
  @OneToMany(() => Plat, (plat) => plat.categorie, { cascade: true })
  plats!: Plat[];
}
