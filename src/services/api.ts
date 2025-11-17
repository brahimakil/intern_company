import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('companyToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const companyApi = {
  register: async (data: any) => {
    const response = await api.post('/auth/company/register', data);
    return response.data;
  },

  login: async (idToken: string) => {
    const response = await api.post('/auth/company/login', { idToken });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/company/profile');
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/company-dashboard/stats');
    return response.data;
  },
};

export const updateCompanyLogo = async (companyId: string, logoUrl: string) => {
  const response = await api.patch(`/auth/company/update-logo/${companyId}`, { logoUrl });
  return response.data;
};
