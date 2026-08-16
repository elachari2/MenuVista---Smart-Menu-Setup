import { IsUUID, IsString, IsNotEmpty } from 'class-validator';

/**
 * Objet de transfert de données (DTO) pour la réponse de l'endpoint d'upload de menu.
 */
export class UploadResponseDto {
  /** Identifiant unique du job généré (UUID v4) */
  @IsUUID('4')
  @IsNotEmpty()
  jobId!: string;

  /** Statut initial du job */
  @IsString()
  @IsNotEmpty()
  status!: string;

  /** Message de confirmation */
  @IsString()
  @IsNotEmpty()
  message!: string;

  /** Horodatage de réception */
  @IsNotEmpty()
  createdAt!: Date;
}
