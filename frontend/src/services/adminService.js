import API from './api';

const adminService = {
  // Admin Authentication
  loginAdmin: async (credentials) => {
    const response = await API.post('/admin/login', credentials);
    if (response.data.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Dashboard Summary
  getDashboard: async () => {
    const response = await API.get('/admin/dashboard');
    return response.data;
  },

  // User Management
  getUsers: async (params = {}) => {
    const response = await API.get('/admin/users', { params });
    return response.data;
  },

  getUser: async (id) => {
    const response = await API.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await API.put(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await API.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // NGO Approvals
  getNGOs: async (params = {}) => {
    const response = await API.get('/admin/ngos', { params });
    return response.data;
  },

  approveNGO: async (id) => {
    const response = await API.put(`/admin/ngos/${id}/approve`);
    return response.data;
  },

  rejectNGO: async (id) => {
    const response = await API.put(`/admin/ngos/${id}/reject`);
    return response.data;
  },

  // Food Listing Moderation
  getFoodListings: async (params = {}) => {
    const response = await API.get('/admin/food', { params });
    return response.data;
  },

  deleteFoodListing: async (id) => {
    const response = await API.delete(`/admin/food/${id}`);
    return response.data;
  },

  // Claims Management
  getClaims: async () => {
    const response = await API.get('/admin/claims');
    return response.data;
  },

  updateClaimStatus: async (id, status) => {
    const response = await API.put(`/admin/claims/${id}/status`, { status });
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await API.get('/admin/notifications');
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await API.put(`/admin/notifications/${id}/read`);
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await API.delete(`/admin/notifications/${id}`);
    return response.data;
  },

  // Logs & Charts Analytics
  getLogs: async () => {
    const response = await API.get('/admin/logs');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await API.get('/admin/analytics');
    return response.data;
  }
};

export default adminService;
