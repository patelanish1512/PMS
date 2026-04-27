import { apiFetch } from './apiClient';

export async function login(credentials: any) {
  const response = await apiFetch<any>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  if (response && response.token) {
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user_info', JSON.stringify(response.user || response));
  }

  return response;
}

export async function register(userData: any) {
  return apiFetch<any>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
}

export function getCurrentUser() {
  const userInfo = localStorage.getItem('user_info');
  return userInfo ? JSON.parse(userInfo) : null;
}
