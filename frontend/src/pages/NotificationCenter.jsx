import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Check,
  ArrowLeft,
  ChevronDown,
  Loader2,
  Trash2,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import NotificationCard from '../components/Common/NotificationCard';

const NotificationCenter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');

  // Instantiate our notifications custom hook
  const {
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
    deleteNotification
  } = useNotifications('ALL', 10);

  const handleTabChange = (newType) => {
    setActiveTab(newType);
    setType(newType);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  const handleNotificationClick = async (notif) => {
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

    // Deep link routing based on event type
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

  const handleBack = () => {
    if (user?.role === 'Admin') navigate('/admin');
    else if (user?.role === 'NGO') navigate('/ngo');
    else navigate('/donor');
  };

  const tabItems = [
    { id: 'ALL', label: 'All Alerts', color: 'border-emerald-500 text-emerald-700 bg-emerald-50/50' },
    { id: 'SUCCESS', label: 'Success', color: 'border-teal-500 text-teal-700 bg-teal-50/50' },
    { id: 'INFO', label: 'Info', color: 'border-sky-500 text-sky-700 bg-sky-50/50' },
    { id: 'WARNING', label: 'Warnings', color: 'border-amber-500 text-amber-700 bg-amber-50/50' },
    { id: 'ERROR', label: 'Errors', color: 'border-rose-500 text-rose-700 bg-rose-50/50' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Back Button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notification Center</h1>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              Manage your real-time updates and transactional alerts
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-200 hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Check className="w-4 h-4" />
              <span>Mark All as Read</span>
            </button>
          )}
          <div className="py-2.5 px-4 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200/50">
            {unreadCount} Unread
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-slate-100 shadow-xl shadow-slate-100/40 rounded-3xl overflow-hidden p-6 sm:p-8">
        {/* Search & Filters row */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-slate-100 pb-6 mb-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
            {tabItems.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? tab.color
                      : 'border-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100/50 text-xs font-medium bg-slate-50/50 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Notifications List */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold mb-6">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {notifications.length === 0 && !loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Bell className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-700">No notifications found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {search || type !== 'ALL'
                  ? "We couldn't find any alerts matching your search criteria or filter tabs."
                  : "You don't have any notifications logged at the moment. As actions take place on FoodBridge, you'll see updates here!"}
              </p>
              {(search || type !== 'ALL') && (
                <button
                  onClick={() => {
                    handleTabChange('ALL');
                    handleClearSearch();
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {notifications.map((notif) => (
                <NotificationCard
                  key={notif._id || notif.id}
                  notification={notif}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={() => handleNotificationClick(notif)}
                />
              ))}

              {/* Load more triggers */}
              {hasMore && (
                <div className="pt-6 flex justify-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="py-2.5 px-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-extrabold flex items-center gap-2 shadow-sm transition-all hover:border-slate-300 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <span>Load More Alerts</span>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {loading && notifications.length === 0 && (
            <div className="py-20 flex justify-center items-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
