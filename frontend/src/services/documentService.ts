import { apiFetch, apiUpload } from './apiClient';

export async function getDocuments() {
  return apiFetch<any[]>('/api/attachments');
}

export async function getDocumentsByProject(projectId: string) {
  return apiFetch<any[]>(`/api/attachments/project/${projectId}`);
}

export async function getDocumentsByTask(taskId: string) {
  return apiFetch<any[]>(`/api/attachments/task/${taskId}`);
}

export async function uploadDocument(file: File, projectId: string, projectName: string, taskId?: string, taskName?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);
  formData.append('projectName', projectName);
  if (taskId) formData.append('taskId', taskId);
  if (taskName) formData.append('taskName', taskName);
  
  return apiUpload<any>('/api/attachments/upload', formData);
}

export async function deleteDocument(id: string) {
  return apiFetch<void>(`/api/attachments/${id}`, {
    method: 'DELETE',
  });
}

// Client-specific
export async function getClientDocuments() {
  return apiFetch<any[]>('/api/client/documents');
}
