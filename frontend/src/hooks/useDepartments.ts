import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Department {
  id: string;
  name: string;
  code: string;
}

export function useDepartments() {
  return useQuery<Department[], Error>({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/api/v1/departments');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 10,
  });
}