import { apiFetch } from './apiClient';

export async function getDashboardData() {
  const userStr = localStorage.getItem('user_info');
  const user = userStr ? JSON.parse(userStr) : null;
  if (user?.role === 'Client') {
    return apiFetch<any>('/api/dashboard/client');
  }
  return apiFetch<any>('/api/dashboard');
}

export async function getDashboardStats() {
  return apiFetch<any[]>('/api/dashboard/stats');
}

export async function getProjectHealth() {
  return apiFetch<any[]>('/api/dashboard/project-health');
}

export async function getTaskStatus() {
  return apiFetch<any[]>('/api/dashboard/task-status');
}

export async function getCompletionTrend() {
  return apiFetch<any[]>('/api/dashboard/completion-trend');
}

export async function getUpcomingMilestones() {
  return apiFetch<any[]>('/api/dashboard/upcoming-milestones');
}
