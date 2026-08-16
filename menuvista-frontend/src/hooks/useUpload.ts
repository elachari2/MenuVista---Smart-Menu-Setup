import { useMutation } from '@tanstack/react-query';
import { uploadMenuFile } from '../api/menuApi';
import { UploadResponse } from '../types/menu.types';

/**
 * Hook personnalisé gérant la mutation d'upload d'un fichier de menu.
 */
export const useUpload = () => {
  return useMutation<UploadResponse, Error, File>({
    mutationFn: (file: File) => uploadMenuFile(file),
  });
};
