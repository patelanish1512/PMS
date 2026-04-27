import { apiFetch } from './apiClient';

export async function getMilestones() {
  return apiFetch<any[]>('/api/milestones');
}

export async function getMilestonesByProject(projectId: string) {
  return apiFetch<any[]>(`/api/milestones/project/${projectId}`);
}

export async function createMilestone(milestone: any) {
  return apiFetch<any>('/api/milestones', {
    method: 'POST',
    body: JSON.stringify(milestone),
  });
}

export async function updateMilestone(id: string, milestone: any) {
  return apiFetch<void>(`/api/milestones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(milestone),
  });
}

export async function deleteMilestone(id: string) {
  return apiFetch<void>(`/api/milestones/${id}`, {
    method: 'DELETE',
  });
}

// Client-specific
export async function getClientMilestones() {
  return apiFetch<any[]>('/api/client/milestones');
}
