import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'emerald', trend }) => {
  const colorMap = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-100' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700', border: 'border-blue-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', border: 'border-amber-100' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', badge: 'bg-rose-100 text-rose-700', border: 'border-rose-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', border: 'border-purple-100' },
    teal: { bg: 'bg-teal-50', icon: 'text-teal-600', badge: 'bg-teal-100 text-teal-700', border: 'border-teal-100' },
  };
  const c = colorMap[color] || colorMap.emerald;

  return (
    <div className={`bg-white rounded-2xl p-6 border ${c.border} shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-800">{value}</p>
          {trend && (
            <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
              {trend}
            </span>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center`}>
          {Icon && <Icon className={`w-6 h-6 ${c.icon}`} />}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
