import React from 'react';
import { Bell, X, Check, Trash2, ArrowRight } from 'lucide-react';
import NotificationCard from './NotificationCard';

const NotificationDropdown = ({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onNotificationClick,
  onViewAll
}) => {
  if (!isOpen) return null;

  // Take only the 5 most recent notifications for the preview
  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-100 shadow-2xl rounded-3xl z-50 overflow-hidden animate-fadeIn transform origin-top-right transition-all">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-teal-50/10 flex justify-between items-center">
        <div>
          <h4 className="font-extrabold text-sm text-slate-800">Alert Center</h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            {unreadCount} Unread Notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && onMarkAllRead && (
            <button
              onClick={onMarkAllRead}
              title="Mark all as read"
              className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List items */}
      <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-50 p-2 space-y-1">
        {recentNotifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-xs font-semibold text-slate-500">All caught up!</p>
            <p className="text-[10px] text-slate-400 mt-1">No new notifications</p>
          </div>
        ) : (
          recentNotifications.map((notif) => (
            <NotificationCard
              key={notif._id || notif.id}
              notification={notif}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
              onClick={() => onNotificationClick(notif)}
            />
          ))
        )}
      </div>

      {/* Footer link to Notification Center */}
      <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex justify-center">
        <button
          onClick={onViewAll}
          className="w-full py-2 px-4 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 hover:border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span>View All Notifications</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
