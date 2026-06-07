import API from './api';

const authService = {
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  forgotPassword: async (email) => {
    const response = await API.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await API.post('/auth/reset-password', { token, password });
    return response.data;
  },

  getMe: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await API.put('/auth/profile', profileData);
    return response.data;
  },

  updatePassword: async (passwordData) => {
    const response = await API.put('/auth/password', passwordData);
    return response.data;
  }
};

export default authService;
