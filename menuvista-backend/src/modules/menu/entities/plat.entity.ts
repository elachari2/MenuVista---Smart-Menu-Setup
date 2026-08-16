import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Categorie, MultilingualText } from './categorie.entity';

/** Statuts de validation d'un plat */
export enum StatutValidationEnum {
  EN_ATTENTE = 'en_attente',
  VALIDE = 'valide',
  REJETE = 'rejete',
}

/** Origines de l'image d'un plat */
export enum SourceImageEnum {
  UPLOAD = 'upload',
  GENEREE_IA = 'generee_ia',
  DEFAUT = 'defaut',
}

/**
 * Entité TypeORM représentant un plat d'un menu.
 */
@Entity('plats')
export class Plat {
  /** Identifiant unique du plat (UUID v4) */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Nom multilingue stocké au format JSONB */
  @Column({ type: 'jsonb' })
  nom!: MultilingualText;

  /** Description multilingue du plat en JSONB (optionnelle) */
  @Column({ type: 'jsonb', nullable: true })
  description!: MultilingualText | null;

  /** Prix du plat en Euros/MAD/USD/etc. */
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  prix!: number;

  /** Symbole ou code ISO de la monnaie (ex: 'MAD', 'EUR', 'USD', 'AED') */
  @Column({ type: 'varchar', length: 10, nullable: true, default: 'MAD' })
  devise!: string | null;

  /** URL de l'image d'illustration du plat */
  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  /** Liste des allergènes déclarés */
  @Column({ type: 'simple-array', nullable: true })
  allergenes!: string[] | null;

  /** Tags du plat (ex: 'végétarien', 'épicé') */
  @Column({ type: 'simple-array', nullable: true })
  tags!: string[] | null;

  /** Statut de validation par le restaurateur */
  @Column({
    name: 'statut_validation',
    type: 'enum',
    enum: StatutValidationEnum,
    default: StatutValidationEnum.EN_ATTENTE,
  })
  statutValidation!: StatutValidationEnum;

  /** Source de l'image du plat */
  @Column({
    name: 'source_image',
    type: 'enum',
    enum: SourceImageEnum,
    default: SourceImageEnum.UPLOAD,
  })
  sourceImage!: SourceImageEnum;

  /** Catégorie parente du plat */
  @ManyToOne(() => Categorie, (categorie) => categorie.plats, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categorie_id' })
  categorie!: Categorie;

  /** Date de création */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** Date de dernière mise à jour */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
