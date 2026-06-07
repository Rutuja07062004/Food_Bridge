import React from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const iconMap = {
  NEW_LISTING: <Bell className="w-5 h-5 text-emerald-500" />,
  FOOD_CLAIMED: <CheckCircle className="w-5 h-5 text-blue-500" />,
  DONATION_COMPLETED: <CheckCircle className="w-5 h-5 text-green-500" />,
  CLAIM_STATUS_UPDATE: <Info className="w-5 h-5 text-amber-500" />,
  DEFAULT: <Bell className="w-5 h-5 text-slate-500" />,
};

const colorMap = {
  NEW_LISTING: 'border-l-emerald-500 bg-emerald-50',
  FOOD_CLAIMED: 'border-l-blue-500 bg-blue-50',
  DONATION_COMPLETED: 'border-l-green-500 bg-green-50',
  CLAIM_STATUS_UPDATE: 'border-l-amber-500 bg-amber-50',
  DEFAULT: 'border-l-slate-400 bg-slate-50',
};

const ToastItem = ({ notification, onRemove }) => {
  const icon = iconMap[notification.type] || iconMap.DEFAULT;
  const color = colorMap[notification.type] || colorMap.DEFAULT;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border border-white shadow-xl border-l-4 ${color} animate-slideIn`}>
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">{notification.title}</p>
        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notification.message}</p>
      </div>
      <button onClick={() => onRemove(notification.id)} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const Toast = () => {
  const { notifications, removeNotification } = useSocket();

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 w-80">
      {notifications.map((n) => (
        <ToastItem key={n.id} notification={n} onRemove={removeNotification} />
      ))}
    </div>
  );
};

export default Toast;
