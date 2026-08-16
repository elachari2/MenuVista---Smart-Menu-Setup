import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { Categorie } from './categorie.entity';

/** Statuts d'édition d'un menu */
export enum MenuStatutEnum {
  BROUILLON = 'brouillon',
  EN_REVISION = 'en_revision',
  PUBLIE = 'publie',
}

/**
 * Entité TypeORM représentant un menu digitalisé.
 */
@Entity('menus')
export class Menu {
  /** Identifiant unique du menu (UUID v4) */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Statut actuel du menu */
  @Column({
    type: 'enum',
    enum: MenuStatutEnum,
    default: MenuStatutEnum.BROUILLON,
  })
  statut!: MenuStatutEnum;

  /** Langues disponibles pour ce menu (ex: ['fr', 'ar', 'en']) */
  @Column({ type: 'text', array: true, default: ['fr'] })
  langues!: string[];

  /** Restaurant propriétaire du menu */
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menus, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant!: Restaurant;

  /** Catégories composant le menu */
  @OneToMany(() => Categorie, (categorie) => categorie.menu, {
    cascade: true,
  })
  categories!: Categorie[];

  /** Date de création du menu */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** Date de dernière mise à jour */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
