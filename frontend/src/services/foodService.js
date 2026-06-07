import API from './api';

const foodService = {
  createListing: async (listingData) => {
    const response = await API.post('/food', listingData);
    return response.data;
  },

  getListings: async (params = {}) => {
    const response = await API.get('/food', { params });
    return response.data;
  },

  getListing: async (id) => {
    const response = await API.get(`/food/${id}`);
    return response.data;
  },

  updateListing: async (id, listingData) => {
    const response = await API.put(`/food/${id}`, listingData);
    return response.data;
  },

  deleteListing: async (id) => {
    const response = await API.delete(`/food/${id}`);
    return response.data;
  },

  completeListing: async (id) => {
    const response = await API.patch(`/food/${id}/complete`);
    return response.data;
  },

  claimListing: async (foodId, pickupTime) => {
    const response = await API.post('/claim', { foodId, pickupTime });
    return response.data;
  },

  getClaims: async () => {
    const response = await API.get('/claim');
    return response.data;
  },

  updateClaimStatus: async (claimId, status) => {
    const response = await API.patch(`/claim/${claimId}/status`, { status });
    return response.data;
  },

  getDonorStats: async () => {
    const response = await API.get('/food/donor/stats');
    return response.data;
  },

  getDonorAnalytics: async () => {
    const response = await API.get('/food/donor/analytics');
    return response.data;
  },

  predictFreshness: async (inputs) => {
    const response = await API.post('/freshness/predict', inputs);
    return response.data;
  },

  getFreshness: async (foodId) => {
    const response = await API.get(`/freshness/${foodId}`);
    return response.data;
  }
};

export default foodService;
