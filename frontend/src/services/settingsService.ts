import { apiFetch } from './apiClient';

export async function getSettings() {
  return apiFetch<any>('/api/settings');
}

export async function updateSettings(settings: any) {
  return apiFetch<any>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}
