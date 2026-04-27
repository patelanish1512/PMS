import { apiFetch } from './apiClient';

export async function getCompanies() {
  return apiFetch<any[]>('/api/companies');
}

export async function getCompanyById(id: string) {
  return apiFetch<any>(`/api/companies/${id}`);
}

export async function createCompany(company: any) {
  return apiFetch<any>('/api/companies', {
    method: 'POST',
    body: JSON.stringify(company),
  });
}

export async function updateCompany(id: string, company: any) {
  return apiFetch<void>(`/api/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(company),
  });
}

export async function deleteCompany(id: string) {
  return apiFetch<void>(`/api/companies/${id}`, {
    method: 'DELETE',
  });
}
