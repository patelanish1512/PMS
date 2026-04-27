import { apiFetch } from './apiClient';

export async function getTaskBoard() {
  return apiFetch<any>('/api/tasks/board');
}

export async function getTasks() {
  return apiFetch<any[]>('/api/tasks');
}

export async function getTasksByProject(projectId: string) {
  return apiFetch<any[]>(`/api/tasks/project/${projectId}`);
}

export async function getAssignedTasks() {
  return apiFetch<any[]>('/api/tasks/assigned');
}

export async function createTask(task: any) {
  return apiFetch<any>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

export async function updateTask(id: string, task: any) {
  return apiFetch<void>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(task),
  });
}

export async function updateTaskStatus(id: string, status: string) {
  return apiFetch<void>(`/api/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function deleteTask(id: string) {
  return apiFetch<void>(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}
