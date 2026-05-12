import { useDepartments } from '@/hooks/useGrievances';
import Link from 'next/link';

export default function DepartmentsPage() {
  const { departments, loading } = useDepartments();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Departments</h1>
      {departments.length === 0 ? (
        <p className="text-gray-500">No departments found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept: any) => (
            <div key={dept.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h2 className="text-xl font-semibold text-gray-900">{dept.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Code: {dept.code}</p>
              <Link href={`/grievances?departmentId=${dept.id}`} className="mt-4 inline-block text-blue-600 hover:underline text-sm">
                View Grievances &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}