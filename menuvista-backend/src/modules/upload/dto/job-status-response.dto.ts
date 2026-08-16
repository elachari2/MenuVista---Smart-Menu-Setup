import { IsUUID, IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * Objet de transfert de données (DTO) pour le statut d'un job de numérisation OCR et structuration.
 */
export class JobStatusResponseDto {
  /** Identifiant unique du job (UUID v4) */
  @IsUUID('4')
  @IsNotEmpty()
  jobId!: string;

  /** Nom d'origine du fichier de menu */
  @IsString()
  @IsNotEmpty()
  originalFilename!: string;

  /** Statut actuel du traitement */
  @IsString()
  @IsNotEmpty()
  status!: string;

  /** Texte brut extrait par l'OCR */
  @IsOptional()
  @IsString()
  ocrRawText!: string | null;

  /** Identifiant unique du menu structuré créé en BDD */
  @IsOptional()
  @IsUUID('4')
  menuId!: string | null;

  /** Message d'erreur si le statut est "echec" */
  @IsOptional()
  @IsString()
  errorMessage!: string | null;

  /** Date de création du job */
  createdAt!: Date;

  /** Date de dernière mise à jour du job */
  updatedAt!: Date;
}
