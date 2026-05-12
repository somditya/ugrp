import { render, screen } from '@testing-library/react';
import GrievanceCard from './GrievanceCard';
import { mockGrievance } from '@/mocks/grievance';

describe('GrievanceCard', () => {
  it('renders the grievance ID', () => {
    render(<GrievanceCard grievance={mockGrievance} />);
    expect(screen.getByText(mockGrievance.grievanceId)).toBeInTheDocument();
  });

  it('renders the category name', () => {
    render(<GrievanceCard grievance={mockGrievance} />);
    expect(screen.getByText(mockGrievance.category.name)).toBeInTheDocument();
  });

  it('renders the grievance description', () => {
    render(<GrievanceCard grievance={mockGrievance} />);
    expect(screen.getByText(mockGrievance.description)).toBeInTheDocument();
  });

  it('renders anonymous complaint label', () => {
    render(
      <GrievanceCard
        grievance={{
          ...mockGrievance,
          id: '2',
          grievanceId: 'UGRP-2026-HSS-00099',
          isAnonymous: true,
        }}
      />
    );
    expect(screen.getByText(/Filed anonymously/)).toBeInTheDocument();
  });
});