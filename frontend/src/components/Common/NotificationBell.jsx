import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Hook handles unreadCount, listing recent ones, and real-time socket events automatically!
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications('ALL', 10);

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    setIsOpen(false);
    
    // Mark as read in DB if unread
    if (!notif.read) {
      try {
        await markAsRead(notif._id || notif.id);
      } catch (err) {
        console.error('Failed to mark notification as read on click:', err);
      }
    }

    const entityId = notif.relatedEntityId;
    const evt = notif.eventType;

    // Deep link navigation logic
    if (['claim_requested', 'claim_approved', 'claim_rejected', 'pickup_scheduled', 'food_collected', 'donation_completed'].includes(evt)) {
      if (entityId) {
        navigate(`/claims/${entityId}`);
      } else {
        navigate(user?.role === 'NGO' ? '/ngo/claims' : '/donor');
      }
    } else if (evt === 'food_listed') {
      navigate(user?.role === 'NGO' ? '/ngo' : '/donor/listings');
    } else if (evt === 'ngo_approved') {
      navigate('/ngo');
    } else if (evt === 'ngo_registration') {
      navigate('/admin');
    } else {
      // Fallback
      if (user?.role === 'Admin') navigate('/admin');
      else if (user?.role === 'NGO') navigate('/ngo');
      else navigate('/donor');
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
          isOpen
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
            : 'bg-slate-50 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-600 border-slate-100 hover:border-emerald-100'
        }`}
      >
        <Bell className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-12 scale-105' : 'hover:rotate-12'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-white text-white text-[10px] flex items-center justify-center font-extrabold shadow-sm animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={markAsRead}
        onMarkAllRead={markAllAsRead}
        onDelete={deleteNotification}
        onNotificationClick={handleNotificationClick}
        onViewAll={handleViewAll}
      />
    </div>
  );
};

export default NotificationBell;
