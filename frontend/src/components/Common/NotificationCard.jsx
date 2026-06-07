import React from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Utensils,
  Calendar,
  Truck,
  Award,
  User,
  Megaphone,
  Activity,
  Trash2,
  Check,
  Eye
} from 'lucide-react';

export const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  // Handle future or minor clock drift
  if (diffMs < 0) return 'Just now';
  
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getEventIcon = (eventType, severityType) => {
  const sizeClass = 'w-5 h-5';
  
  // Map specific event types to premium icons
  switch (eventType) {
    case 'food_listed':
      return <Utensils className={`${sizeClass} text-emerald-500`} />;
    case 'claim_requested':
      return <Award className={`${sizeClass} text-sky-500`} />;
    case 'claim_approved':
      return <CheckCircle2 className={`${sizeClass} text-teal-500`} />;
    case 'claim_rejected':
      return <AlertCircle className={`${sizeClass} text-rose-500`} />;
    case 'pickup_scheduled':
      return <Calendar className={`${sizeClass} text-amber-500`} />;
    case 'food_collected':
      return <Truck className={`${sizeClass} text-indigo-500`} />;
    case 'donation_completed':
      return <CheckCircle2 className={`${sizeClass} text-emerald-500`} />;
    case 'ngo_approved':
      return <Award className={`${sizeClass} text-emerald-500`} />;
    case 'account_suspended':
      return <AlertTriangle className={`${sizeClass} text-rose-500`} />;
    case 'profile_updated':
      return <User className={`${sizeClass} text-slate-500`} />;
    case 'admin_announcement':
      return <Megaphone className={`${sizeClass} text-purple-500`} />;
    case 'system_alert':
      return <Activity className={`${sizeClass} text-rose-500`} />;
    default:
      // Fallback based on severity type
      switch (severityType) {
        case 'SUCCESS':
          return <CheckCircle2 className={`${sizeClass} text-emerald-500`} />;
        case 'WARNING':
          return <AlertTriangle className={`${sizeClass} text-amber-500`} />;
        case 'ERROR':
          return <AlertCircle className={`${sizeClass} text-rose-500`} />;
        default:
          return <Info className={`${sizeClass} text-sky-500`} />;
      }
  }
};

const getSeverityStyles = (severityType, isRead) => {
  const baseStyles = 'border-l-4 transition-all duration-300';
  
  if (isRead) {
    return {
      container: `${baseStyles} border-slate-200 bg-white hover:bg-slate-50 border`,
      iconBg: 'bg-slate-100 text-slate-500'
    };
  }

  switch (severityType) {
    case 'SUCCESS':
      return {
        container: `${baseStyles} border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 border border-emerald-100/50`,
        iconBg: 'bg-emerald-100/60 ring-2 ring-emerald-100/30'
      };
    case 'WARNING':
      return {
        container: `${baseStyles} border-amber-500 bg-amber-50/20 hover:bg-amber-50/40 border border-amber-100/50`,
        iconBg: 'bg-amber-100/60 ring-2 ring-amber-100/30'
      };
    case 'ERROR':
      return {
        container: `${baseStyles} border-rose-500 bg-rose-50/20 hover:bg-rose-50/40 border border-rose-100/50`,
        iconBg: 'bg-rose-100/60 ring-2 ring-rose-100/30'
      };
    case 'INFO':
    default:
      return {
        container: `${baseStyles} border-sky-500 bg-sky-50/20 hover:bg-sky-50/40 border border-sky-100/50`,
        iconBg: 'bg-sky-100/60 ring-2 ring-sky-100/30'
      };
  }
};

const NotificationCard = ({ notification, onMarkRead, onDelete, onClick }) => {
  const { _id, title, message, type, eventType, read, createdAt } = notification;
  const styles = getSeverityStyles(type, read);

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-start gap-4 p-5 rounded-2xl shadow-sm cursor-pointer ${styles.container}`}
    >
      {/* Icon Badge */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${styles.iconBg}`}>
        {getEventIcon(eventType, type)}
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0 pr-16">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className={`text-sm font-bold tracking-tight ${read ? 'text-slate-700' : 'text-slate-900 font-extrabold'}`}>
            {title}
          </h4>
          {!read && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white uppercase tracking-wider animate-pulse">
              New
            </span>
          )}
        </div>
        <p className={`text-xs mt-1 leading-relaxed ${read ? 'text-slate-500' : 'text-slate-600 font-medium'}`}>
          {message}
        </p>
        <span className="text-[10px] text-slate-400 font-semibold mt-2.5 block tracking-wide">
          {formatTimeAgo(createdAt)}
        </span>
      </div>

      {/* Actions (Slide In or Hover Visible) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            title="View details"
            className="p-1.5 rounded-lg bg-white border border-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 shadow-sm transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
        {!read && onMarkRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(_id);
            }}
            title="Mark as read"
            className="p-1.5 rounded-lg bg-white border border-slate-100 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 shadow-sm transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(_id);
            }}
            title="Delete notification"
            className="p-1.5 rounded-lg bg-white border border-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 shadow-sm transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
