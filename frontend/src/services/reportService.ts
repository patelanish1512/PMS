import { apiFetch } from './apiClient';

export async function getReportStats() {
  return apiFetch<any>('/api/reports/stats');
}

export async function getRecentReports() {
  return apiFetch<any[]>('/api/reports/recent');
}

export async function getAllReports() {
  return apiFetch<any>('/api/reports/all');
}
