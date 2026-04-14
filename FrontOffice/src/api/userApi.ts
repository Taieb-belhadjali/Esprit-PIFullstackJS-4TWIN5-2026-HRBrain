import API from './api';

export interface LanguageOption {
  code: string;
}

export const userApi = {
  getLanguages: async (): Promise<LanguageOption[]> => {
    const { data } = await API.get('/users/settings/languages');
    return data;
  },

  updateLanguage: async (language: string): Promise<void> => {
    const auth = JSON.parse(localStorage.getItem('hrbrain_auth') || '{}');
    console.log('Full auth object:', auth);
    console.log('User object:', auth.user);
    const userId = auth?.user?.id;
    console.log('User ID:', userId);
    if (!userId) throw new Error('User not authenticated');
    await API.put(`/users/${userId}`, { language });
  },
};