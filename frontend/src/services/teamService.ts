import { apiFetch } from './apiClient';

export async function getTeamMembers() {
  return apiFetch<any[]>('/api/users');
}
