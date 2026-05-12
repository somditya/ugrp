import { render, screen } from '@testing-library/react';
import GrievanceList from './GrievanceList';
import { mockGrievances } from '@/mocks/grievance';

describe('GrievanceList', () => {
  it('renders a list of grievances', () => {
    render(<GrievanceList grievances={mockGrievances} />);
    expect(screen.getByText(mockGrievances[0].grievanceId)).toBeInTheDocument();
    expect(screen.getByText(mockGrievances[2].grievanceId)).toBeInTheDocument();
  });

  it('shows empty state when no grievances', () => {
    render(<GrievanceList grievances={[]} />);
    expect(screen.getByText(/No grievances found/)).toBeInTheDocument();
  });
});