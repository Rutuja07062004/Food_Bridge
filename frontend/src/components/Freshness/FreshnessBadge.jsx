import React from 'react';

const STATUS_STYLING = {
  'Fresh': 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  'Consume Soon': 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400',
  'Near Expiry': 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30 text-orange-700 dark:text-orange-400',
  'Expired': 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400'
};

const FreshnessBadge = ({ status }) => {
  const resolvedStatus = status || 'Fresh';
  const styling = STATUS_STYLING[resolvedStatus] || STATUS_STYLING['Fresh'];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border capitalize transition-all ${styling}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        resolvedStatus === 'Fresh' ? 'bg-emerald-500' :
        resolvedStatus === 'Consume Soon' ? 'bg-amber-500' :
        resolvedStatus === 'Near Expiry' ? 'bg-orange-500' : 'bg-rose-500'
      }`} />
      <span>{resolvedStatus}</span>
    </span>
  );
};

export default FreshnessBadge;
