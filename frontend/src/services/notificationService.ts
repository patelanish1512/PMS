import { apiFetch } from './apiClient';

export async function getNotifications(userId: string) {
  return apiFetch<any[]>(`/api/notifications/user/${userId}`);
}

export async function getAllNotifications() {
  return apiFetch<any[]>('/api/notifications');
}

export async function markAsRead(id: string) {
  return apiFetch<void>(`/api/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllAsRead() {
  return apiFetch<void>('/api/notifications/read-all', {
    method: 'PATCH',
  });
}

export async function deleteNotification(id: string) {
  return apiFetch<void>(`/api/notifications/${id}`, {
    method: 'DELETE',
  });
}
