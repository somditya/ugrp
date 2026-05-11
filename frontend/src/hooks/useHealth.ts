import { useState, useEffect } from 'react';

export interface HealthStatus {
  status: string;
  timestamp: string;
}

export function useHealth() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => {
        setStatus({ status: 'error', timestamp: new Date().toISOString() });
        setLoading(false);
      });
  }, []);

  return { status, loading };
}
