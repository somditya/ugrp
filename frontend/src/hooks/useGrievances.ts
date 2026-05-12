import { useState, useEffect, useCallback } from 'react';
import { Grievance, PaginatedResponse, ApiResponse } from '@/types';

export function useGrievances(page: number = 1, status?: string) {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Grievance>['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrievances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let query = '?page=' + String(page);
      if (status) query += '&status=' + status;
      const res = await fetch('/api/grievances' + query);
      if (!res.ok) throw new Error('HTTP ' + String(res.status));
      const json: ApiResponse<PaginatedResponse<Grievance>> = await res.json();
      setGrievances(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch (err: any) {
      setError(err.message || 'Failed to load grievances');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchGrievances();
  }, [fetchGrievances]);

  return { grievances, meta, loading, error, refetch: fetchGrievances };
}

export function useDepartments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/departments')
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        setDepartments([]);
        setLoading(false);
      });
  }, []);

  return { departments, loading };
}