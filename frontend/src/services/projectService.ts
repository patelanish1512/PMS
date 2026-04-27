import { apiFetch } from './apiClient';

export async function getProjects() {
  return apiFetch<any[]>('/api/projects');
}

export async function getAssignedProjects() {
  return apiFetch<any[]>('/api/projects/assigned');
}

export async function getProjectById(id: string) {
  return apiFetch<any>(`/api/projects/${id}`);
}
export async function createProject(project: any) {
  return apiFetch<any>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
}

export async function updateProject(id: string, project: any) {
  return apiFetch<any>(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(project),
  });
}

export async function deleteProject(id: string) {
  return apiFetch<any>(`/api/projects/${id}`, {
    method: 'DELETE',
  });
}

// Client Endpoints
export async function getClientProjects() {
  return apiFetch<any[]>('/api/client/projects');
}

export async function getClientProject(id: string) {
  return apiFetch<any>(`/api/client/projects/${id}`);
}

export async function getClientMilestones(id: string) {
  return apiFetch<any[]>(`/api/client/projects/${id}/milestones`);
}

export async function getClientDocuments(id: string) {
  return apiFetch<any[]>(`/api/client/projects/${id}/documents`);
}

export async function getClientReports(id: string) {
  return apiFetch<any[]>(`/api/client/projects/${id}/reports`);
}
