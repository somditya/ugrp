import { Grievance, PriorityFlag, GrievanceStatus } from '@/types';
import { formatDate, getPriorityColor, getStatusColor } from '@/utils/formatDate';

interface Props {
  grievance: Grievance;
}

export default function GrievanceCard({ grievance }: Props) {
  return (
    <article className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900">{grievance.grievanceId}</h2>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getPriorityColor(grievance.priorityFlag)}`}>
          {grievance.priorityFlag}
        </span>
      </div>
      <h3 className="text-base text-gray-700 mb-2">{grievance.category.name}</h3>
      {grievance.isAnonymous ? (
        <p className="text-gray-500 text-sm mb-2">Filed anonymously</p>
      ) : (
        <p className="text-gray-500 text-sm mb-2">By {grievance.complainant?.name || 'Unknown'}</p>
      )}
      <p className="text-gray-600 mb-4 line-clamp-2">{grievance.description}</p>
      <div className="flex items-center justify-between text-sm">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(grievance.status)}`}>
          {grievance.status.replace('_', ' ')}
        </span>
        <span className="text-gray-500">{formatDate(grievance.createdAt)}</span>
      </div>
    </article>
  );
}