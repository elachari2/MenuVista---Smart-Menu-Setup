import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Énumération des statuts possibles pour un job d'upload et traitement OCR/Structuration.
 */
export enum JobStatus {
  RECU = 'recu',
  OCR_EN_COURS = 'ocr_en_cours',
  OCR_TERMINE = 'ocr_termine',
  ECHEC = 'echec',
}

/**
 * Entité TypeORM représentant un job de numérisation de menu.
 * Conserve le statut de traitement, le texte OCR extrait et l'ID du menu structuré généré.
 */
@Entity('menu_upload_jobs')
export class MenuUploadJob {
  /** Identifiant unique du job (UUID v4) */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Nom d'origine du fichier téléversé */
  @Column({ name: 'original_filename', type: 'varchar', length: 255 })
  originalFilename!: string;

  /** Chemin du fichier stocké temporairement sur le disque */
  @Column({ name: 'file_path', type: 'varchar', length: 500 })
  filePath!: string;

  /** Statut actuel du job */
  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.RECU,
  })
  status!: JobStatus;

  /** Texte brut extrait par le moteur OCR Tesseract */
  @Column({ name: 'ocr_raw_text', type: 'text', nullable: true })
  ocrRawText!: string | null;

  /** Identifiant unique du menu structuré généré en BDD (traçabilité inverse) */
  @Column({ name: 'menu_id', type: 'uuid', nullable: true })
  menuId!: string | null;

  /** Message d'erreur éventuel en cas d'échec du job */
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  /** Date de création du job */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /** Date de dernière mise à jour du job */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
