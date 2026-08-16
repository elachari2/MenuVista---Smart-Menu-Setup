import { useQuery } from '@tanstack/react-query';
import { getMenuPreview } from '../api/menuApi';
import { MenuPreview } from '../types/menu.types';

/**
 * Hook personnalisé React Query gérant la récupération du menu structuré.
 * @param menuId Identifiant UUID v4 du menu
 */
export const useMenuPreview = (menuId: string) => {
  return useQuery<MenuPreview, Error>({
    queryKey: ['menu', 'preview', menuId],
    queryFn: () => getMenuPreview(menuId),
    enabled: Boolean(menuId),
    staleTime: 5 * 60 * 1000, // Conservation en cache pendant 5 minutes
    retry: 2,
  });
};
