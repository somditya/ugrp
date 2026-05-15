import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  stakeholderType: string;
  slaWorkingDays: number;
  isPriorityCritical: boolean;
  parentId: string | null;
  children?: Category[];
}

export function useCategories(stakeholderType?: string) {
  return useQuery<Category[], Error>({
    queryKey: ['categories', stakeholderType],
    queryFn: async () => {
      const params = stakeholderType ? `?stakeholderType=${stakeholderType}` : '';
      const response = await api.get(`/api/v1/categories${params}`);
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}