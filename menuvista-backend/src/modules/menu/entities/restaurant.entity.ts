import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Menu } from './menu.entity';

/**
 * Entité TypeORM représentant un restaurant.
 */
@Entity('restaurants')
export class Restaurant {
  /** Identifiant unique du restaurant (UUID v4) */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Nom de l'établissement */
  @Column({ type: 'varchar', length: 150 })
  nom!: string;

  /** Adresse physique du restaurant */
  @Column({ type: 'varchar', length: 255, nullable: true })
  adresse!: string | null;

  /** Langue par défaut du restaurant (ex: 'fr') */
  @Column({ name: 'langue_defaut', type: 'varchar', length: 5, default: 'fr' })
  langueDefaut!: string;

  /** Date de création du restaurant */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** Liste des menus associés au restaurant */
  @OneToMany(() => Menu, (menu) => menu.restaurant)
  menus!: Menu[];
}
