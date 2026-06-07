import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';

export const useNotifications = (initialType = 'ALL', initialLimit = 10) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtering states
  const [type, setType] = useState(initialType);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch paginated notifications list
  const fetchNotifications = useCallback(async (resetList = false) => {
    setLoading(true);
    setError('');
    try {
      const currentPage = resetList ? 1 : page;
      const res = await notificationService.getNotifications({
        type: type === 'ALL' ? undefined : type,
        search: search.trim() || undefined,
        page: currentPage,
        limit: initialLimit
      });

      if (res.success) {
        setNotifications(prev => resetList ? res.data : [...prev, ...res.data]);
        setUnreadCount(res.unreadCount || 0);
        setTotalPages(res.pages || 1);
        setHasMore(currentPage < (res.pages || 1));
      } else {
        setError('Failed to retrieve notifications');
      }
    } catch (err) {
      console.error('Fetch notifications failed:', err);
      setError(err.response?.data?.message || 'Error fetching notifications');
    } finally {
      setLoading(false);
    }
  }, [type, search, page, initialLimit]);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnread();
      if (res.success) {
        setUnreadCount(res.count || 0);
      }
    } catch (err) {
      console.error('Fetch unread count failed:', err);
    }
  }, []);

  // Mark single as read
  const markAsRead = async (id) => {
    try {
      const res = await notificationService.markRead(id);
      if (res.success) {
        setNotifications(prev => 
          prev.map(n => n._id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await notificationService.markAllRead();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      const res = await notificationService.deleteNotification(id);
      if (res.success) {
        const target = notifications.find(n => n._id === id);
        setNotifications(prev => prev.filter(n => n._id !== id));
        if (target && !target.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Delete notification failed:', err);
    }
  };

  // Trigger list reload when filters or search change
  useEffect(() => {
    setPage(1);
    fetchNotifications(true);
  }, [type, search, fetchNotifications]);

  // Load next page
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      // Wait for page state to update, which triggers fetchNotifications automatically
    }
  };

  // Automatically fetch count on mount and listen to socket window event
  useEffect(() => {
    fetchUnreadCount();

    const handleNewSocketNotification = (e) => {
      // Prepend to notifications if types match
      const newNotif = e.detail;
      if (type === 'ALL' || newNotif.type === type) {
        setNotifications(prev => [newNotif, ...prev]);
      }
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('new_in_app_notification', handleNewSocketNotification);
    return () => {
      window.removeEventListener('new_in_app_notification', handleNewSocketNotification);
    };
  }, [type, fetchUnreadCount]);

  // Trigger page fetch when page increments > 1
  useEffect(() => {
    if (page > 1) {
      fetchNotifications(false);
    }
  }, [page, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    type,
    setType,
    search,
    setSearch,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshList: () => fetchNotifications(true)
  };
};
