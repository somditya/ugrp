import { renderHook, act } from '@testing-library/react';
import { useGrievances } from '@/hooks/useGrievances';

const mockFetch = jest.fn();
Object.defineProperty(global, 'fetch', { value: mockFetch, writable: true });

describe('useGrievances', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('fetches grievances successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: '1',
            grievanceId: 'UGRP-2026-CSE-00142',
            complainantId: 'student-1',
            complainant: {
              id: 'student-1',
              universityId: 'UGRP-STU-0001',
              role: 'STUDENT',
              name: 'Amit Patel',
              departmentId: 'dept-1',
              email: 'student1@example.com',
              mobile: null,
              isActive: true,
              emailVerified: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            categoryId: 'cat-1',
            category: {
              id: 'cat-1',
              name: 'Faculty Conduct',
              slug: 'faculty-conduct',
              parentId: null,
              stakeholderType: 'STUDENT',
              slaWorkingDays: 14,
              isPriorityCritical: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            departmentId: 'dept-1',
            department: {
              id: 'dept-1',
              name: 'Computer Science',
              code: 'CSE',
              hodId: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            description: 'Faculty is late.',
            status: 'UNDEREVIEW' as any,
            isAnonymous: false,
            priorityFlag: 'HIGH',
            slaDeadline: new Date(Date.now() + 14 * 86400000).toISOString(),
            resolvedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      }),
    });

    const { result, waitFor } = renderHook(() => useGrievances(1));

    await waitFor(() => !result.current.loading);

    expect(result.current.grievances).toHaveLength(1);
    expect(result.current.meta!.total).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result, waitFor } = renderHook(() => useGrievances(1));

    await waitFor(() => !result.current.loading);

    expect(result.current.error).toBe('Network error');
    expect(result.current.grievances).toHaveLength(0);
  });
});