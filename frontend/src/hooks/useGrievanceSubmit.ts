import { useState } from 'react';
import { api } from '@/lib/api';
import { GrievanceFormData } from '@/app/submit-grievance/page';

interface SubmitResult {
  grievanceId: string;
  slaDeadline: string;
}

export function useGrievanceSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitGrievance = async (data: GrievanceFormData): Promise<SubmitResult | null> => {
    setLoading(true);
    setError(null);

    try {
      // Assuming attachments are handled separately or not passed in initial submission
      // If backend supports inline attachments, adjust this payload
      const response = await api.post('/api/v1/grievances', {
        categoryId: data.categoryId,
        departmentId: data.departmentId,
        description: data.description,
        isAnonymous: data.isAnonymous,
        priorityFlag: data.priorityFlag, // Assuming this might be sent from form
      });

      // Backend should return grievanceId and slaDeadline upon successful submission
      return {
        grievanceId: response.data.data.grievanceId,
        slaDeadline: response.data.data.slaDeadline,
      };
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit grievance');
      console.error("Submission error:", err.response?.data);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { submitGrievance, loading, error };
}