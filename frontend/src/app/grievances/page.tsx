import GrievanceList from './GrievanceList';
import { useGrievances } from '@/hooks/useGrievances';

export default function GrievancesPage() {
  const { grievances, loading, error, meta } = useGrievances(1);

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Grievances</h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <GrievanceList grievances={grievances} />
          {meta && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="text-sm text-gray-600">
                Page {meta.page} of {meta.totalPages} ({meta.total} total)
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}