import React from 'react';

const FoodHealthIndicator = ({ score, status, showText = true }) => {
  const resolvedStatus = status || (
    score !== undefined ? (
      score >= 80 ? 'Fresh' :
      score >= 50 ? 'Consume Soon' :
      score > 0 ? 'Near Expiry' : 'Expired'
    ) : 'Fresh'
  );

  const getColors = (stat) => {
    switch (stat) {
      case 'Fresh':
        return {
          bg: 'bg-emerald-500',
          text: 'text-emerald-700 dark:text-emerald-400',
          pill: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
        };
      case 'Consume Soon':
        return {
          bg: 'bg-amber-500',
          text: 'text-amber-700 dark:text-amber-400',
          pill: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30'
        };
      case 'Near Expiry':
        return {
          bg: 'bg-orange-500',
          text: 'text-orange-700 dark:text-orange-400',
          pill: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30'
        };
      case 'Expired':
      default:
        return {
          bg: 'bg-rose-500',
          text: 'text-rose-700 dark:text-rose-400',
          pill: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'
        };
    }
  };

  const colors = getColors(resolvedStatus);

  if (!showText) {
    return (
      <span className="relative flex h-2.5 w-2.5">
        {resolvedStatus !== 'Expired' && resolvedStatus !== 'Fresh' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.bg} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors.bg}`} title={`Freshness Status: ${resolvedStatus}`} />
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wide transition-all ${colors.pill}`}>
      <span className="relative flex h-1.5 w-1.5">
        {resolvedStatus !== 'Expired' && resolvedStatus !== 'Fresh' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors.bg} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${colors.bg}`} />
      </span>
      <span className={colors.text}>{resolvedStatus}</span>
    </div>
  );
};

export default FoodHealthIndicator;
