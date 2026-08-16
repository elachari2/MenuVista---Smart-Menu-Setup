import axios from 'axios';
import { UploadResponse, JobStatusResponse, MenuPreview } from '../types/menu.types';

// Instance Axios configurée pour l'API Backend NestJS MenuVista
const API_BASE_URL = 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

/**
 * Envoie un fichier image de menu au serveur backend pour initialiser l'OCR.
 * @param file Fichier image (JPG/PNG) sélectionné
 * @returns Réponse contenant le jobId généré
 */
export const uploadMenuFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadResponse>('/menus/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Interroge le backend pour obtenir l'état actuel et le texte OCR d'un job.
 * @param jobId Identifiant UUID v4 du job
 * @returns Détails du statut et texte OCR extrait
 */
export const fetchJobStatus = async (jobId: string): Promise<JobStatusResponse> => {
  const response = await apiClient.get<JobStatusResponse>(`/menus/jobs/${jobId}`);
  return response.data;
};

/**
 * Récupère le menu structuré complet pour la prévisualisation (Sprint 2).
 * @param menuId Identifiant UUID v4 du menu
 * @returns Réponse MenuPreview contenant restaurant, catégories et plats
 */
export const getMenuPreview = async (menuId: string): Promise<MenuPreview> => {
  const response = await apiClient.get<MenuPreview>(`/menus/${menuId}/preview`);
  return response.data;
};
