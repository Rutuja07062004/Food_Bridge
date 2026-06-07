import API from './api';

const notificationService = {
  /**
   * Get notifications with options: search, type (ALL, SUCCESS, WARNING, INFO, ERROR), page, limit
   */
  getNotifications: async (params = {}) => {
    const response = await API.get('/notifications', { params });
    return response.data;
  },

  /**
   * Get unread notifications list & count
   */
  getUnread: async () => {
    const response = await API.get('/notifications/unread');
    return response.data;
  },

  /**
   * Mark single notification as read
   */
  markRead: async (id) => {
    const response = await API.put(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllRead: async () => {
    const response = await API.put('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete single notification
   */
  deleteNotification: async (id) => {
    const response = await API.delete(`/notifications/${id}`);
    return response.data;
  },
};

export default notificationService;
