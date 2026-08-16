import { useQuery } from '@tanstack/react-query';
import { fetchJobStatus } from '../api/menuApi';
import { JobStatusResponse } from '../types/menu.types';

/**
 * Hook personnalisé gérant la consultation récurrente (polling 2s) du statut d'un job.
 * @param jobId Identifiant UUID v4 du job à suivre
 */
export const useJobStatus = (jobId: string) => {
  return useQuery<JobStatusResponse, Error>({
    queryKey: ['jobStatus', jobId],
    queryFn: () => fetchJobStatus(jobId),
    enabled: Boolean(jobId),
    // Polling toutes les 2 secondes si le job est en cours de traitement
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      if (data.status === 'recu' || data.status === 'ocr_en_cours') {
        return 2000;
      }
      return false; // Arrêt automatique dès que terminé ou en échec
    },
    retry: 2,
  });
};
