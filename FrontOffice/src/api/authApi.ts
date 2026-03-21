import API from './api';

export const login = (email: string, password: string) =>
  API.post('/auth/login', { email, password });

export const changePassword = (newPassword: string, token: string) =>
  API.post(
    '/auth/change-password',
    { newPassword },
    { headers: { Authorization: `Bearer ${token}` } },
  );
