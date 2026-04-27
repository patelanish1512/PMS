import { apiFetch } from './apiClient';

export async function getTimeLogs() {
  return apiFetch<any[]>('/api/time-logs');
}

export async function getTimeLogsByProject(projectId: string) {
  return apiFetch<any[]>(`/api/time-logs/project/${projectId}`);
}

export async function getTimeLogsByUser(userId: string) {
  return apiFetch<any[]>(`/api/time-logs/user/${userId}`);
}

export async function createTimeLog(log: any) {
  return apiFetch<any>('/api/time-logs', {
    method: 'POST',
    body: JSON.stringify(log),
  });
}

export async function updateTimeLog(id: string, log: any) {
  return apiFetch<void>(`/api/time-logs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(log),
  });
}

export async function deleteTimeLog(id: string) {
  return apiFetch<void>(`/api/time-logs/${id}`, {
    method: 'DELETE',
  });
}

export async function approveTimeLog(id: string) {
  return apiFetch<void>(`/api/time-logs/${id}/approve`, {
    method: 'PATCH',
  });
}

export async function rejectTimeLog(id: string) {
  return apiFetch<void>(`/api/time-logs/${id}/reject`, {
    method: 'PATCH',
  });
}
