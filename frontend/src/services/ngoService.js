import API from './api';

const ngoService = {
  // NGO Auth
  register: async (ngoData) => {
    const response = await API.post('/ngo/register', ngoData);
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await API.post('/ngo/login', credentials);
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // NGO Profile
  getProfile: async () => {
    const response = await API.get('/ngo/profile');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await API.put('/ngo/profile', profileData);
    return response.data;
  },

  // Claims
  createClaim: async (claimData) => {
    const response = await API.post('/claims', claimData);
    return response.data;
  },

  getMyClaims: async () => {
    const response = await API.get('/claims/my-claims');
    return response.data;
  },

  getClaim: async (id) => {
    const response = await API.get(`/claims/${id}`);
    return response.data;
  },

  updateClaimStatus: async (id, status) => {
    const response = await API.put(`/claims/${id}/status`, { status });
    return response.data;
  }
};

export default ngoService;
