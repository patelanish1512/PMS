import { apiFetch } from './apiClient';

export async function getUsers() {
  return apiFetch<any[]>('/api/users');
}

export async function createUser(user: any) {
  return apiFetch<any>('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export async function updateUser(id: string, user: any) {
  return apiFetch<void>(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });
}

export async function deleteUser(id: string) {
  return apiFetch<void>(`/api/users/${id}`, {
    method: 'DELETE',
  });
}

export async function updateUserRole(id: string, role: string) {
  return apiFetch<void>(`/api/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify(role),
  });
}

export async function deactivateUser(id: string) {
  return apiFetch<void>(`/api/users/${id}/deactivate`, {
    method: 'PATCH',
  });
}

export async function updateUserStatus(id: string, status: string) {
  return apiFetch<void>(`/api/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify(status),
  });
}

export async function getMyProfile() {
  return apiFetch<any>('/api/users/me');
}

export async function updateMyProfile(data: any) {
  return apiFetch<any>('/api/users/me/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: { currentPassword: string; newPassword: string }) {
  return apiFetch<any>('/api/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
