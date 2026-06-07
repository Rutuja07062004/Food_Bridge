import React from 'react';

const FreshnessMeter = ({ score }) => {
  const normalizedScore = Math.min(100, Math.max(0, score !== undefined ? score : 100));
  
  // Circle parameters for SVG progress ring
  const radius = 46;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Resolve color dynamically based on score
  const getColor = (s) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 50) return 'text-amber-500';
    if (s > 0) return 'text-orange-500';
    return 'text-rose-500';
  };

  const getBgColor = (s) => {
    if (s >= 80) return 'bg-emerald-50 text-emerald-700';
    if (s >= 50) return 'bg-amber-50 text-amber-700';
    if (s > 0) return 'bg-orange-50 text-orange-700';
    return 'bg-rose-50 text-rose-700';
  };

  const colorCls = getColor(normalizedScore);
  const badgeCls = getBgColor(normalizedScore);

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* SVG progress ring */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="text-slate-100 stroke-current"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            className={`${colorCls} stroke-current transition-all duration-500 ease-out`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-slate-800">{normalizedScore}%</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Freshness</span>
        </div>
      </div>
      <div className={`mt-3 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${badgeCls}`}>
        {normalizedScore >= 80 ? 'Fresh' :
         normalizedScore >= 50 ? 'Consume Soon' :
         normalizedScore > 0 ? 'Near Expiry' : 'Expired'}
      </div>
    </div>
  );
};

export default FreshnessMeter;
