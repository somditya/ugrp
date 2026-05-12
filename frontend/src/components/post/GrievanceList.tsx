import GrievanceCard from './GrievanceCard';
import { Grievance } from '@/types';

interface Props {
  grievances: Grievance[];
}

export default function GrievanceList({ grievances }: Props) {
  if (grievances.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No grievances found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {grievances.map((grievance) => (
        <GrievanceCard key={grievance.id} grievance={grievance} />
      ))}
    </div>
  );
}