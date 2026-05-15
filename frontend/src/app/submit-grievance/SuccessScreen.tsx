'use client';

import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface SuccessScreenProps {
  grievanceId: string;
  slaDeadline: string;
}

export default function SuccessScreen({ grievanceId, slaDeadline }: SuccessScreenProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-paper-texture flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            Grievance Registered
          </h1>
          <p className="text-gray-600">Your concern has been successfully submitted.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Grievance ID</p>
            <p className="text-2xl font-mono font-bold text-amber-700 tracking-wider">
              {grievanceId}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">SLA Deadline</p>
            <p className="text-lg font-medium text-gray-800">
              {format(new Date(slaDeadline), 'MMM dd, yyyy')}
            </p>
            <p className="text-xs text-gray-500">
              Responses typically within 20 working days
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push(`/grievances/${grievanceId}`)}
            className="w-full py-2.5 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition"
          >
            Track Your Grievance
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}