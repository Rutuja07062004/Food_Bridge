import API from './api';

const claimsService = {
  createClaim: async (claimData) => {
    const response = await API.post('/claims', claimData);
    return response.data;
  },

  getClaims: async () => {
    const response = await API.get('/claims');
    return response.data;
  },

  getClaim: async (id) => {
    const response = await API.get(`/claims/${id}`);
    return response.data;
  },

  approveClaim: async (id) => {
    const response = await API.put(`/claims/${id}/approve`);
    return response.data;
  },

  rejectClaim: async (id) => {
    const response = await API.put(`/claims/${id}/reject`);
    return response.data;
  },

  schedulePickup: async (id, pickupData) => {
    const response = await API.put(`/claims/${id}/schedule-pickup`, pickupData);
    return response.data;
  },

  markCollected: async (id) => {
    const response = await API.put(`/claims/${id}/mark-collected`);
    return response.data;
  },

  confirmCompletion: async (id) => {
    const response = await API.put(`/claims/${id}/confirm-completion`);
    return response.data;
  },
};

export default claimsService;
