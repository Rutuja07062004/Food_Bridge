import React from 'react';
import { Sparkles, Clock, Thermometer, AlertTriangle, ShieldCheck, Info, Calendar } from 'lucide-react';
import FreshnessBadge from './FreshnessBadge';

const IDEAL_TEMPS = {
  'Dairy': 4,
  'Cooked Meals': 4,
  'Veg Meal': 4,
  'Non-Veg Meal': 4,
  'Rice': 4,
  'Vegetables': 8,
  'Fruits & Vegetables': 8,
  'Fruits': 10,
  'Bakery': 20,
  'Bread': 20,
  'Snacks': 20,
  'Groceries': 20,
  'Other': 10
};

const PredictionCard = ({
  score,
  status,
  expiryTime,
  storageType,
  currentTemperature,
  preparationDate,
  preparationTime,
  category,
  isLivePreview = false
}) => {
  // Gracefully handle passed object or individual values
  const resolvedScore = score !== undefined ? score : 100;
  const resolvedStatus = status || 'Fresh';
  const resolvedExpiry = expiryTime ? new Date(expiryTime) : null;
  const resolvedTemp = currentTemperature !== undefined ? currentTemperature : 20;
  const resolvedStorage = storageType || 'Room Temperature';

  // Format preparation date/time
  let prepString = 'Not specified';
  if (preparationDate) {
    const d = new Date(preparationDate);
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    prepString = preparationTime ? `${dateStr} at ${preparationTime}` : dateStr;
  }

  // Storage Advice
  const getStorageAdvice = (type) => {
    switch (type) {
      case 'Frozen':
        return 'Maintain freezer temperature below -18°C. Thaw safely in refrigerator before consumption.';
      case 'Refrigerated':
        return 'Store between 0°C and 4°C to minimize bacterial growth. Keep in sealed airtight containers.';
      case 'Room Temperature':
      default:
        return 'Keep in a cool, dry place away from direct sunlight. Consume as soon as possible.';
    }
  };

  // Check temperature penalty
  const idealTemp = IDEAL_TEMPS[category] || 10;
  const tempDiff = resolvedTemp - idealTemp;
  const hasTempPenalty = tempDiff > 0 && resolvedStorage !== 'Frozen';

  // Hours remaining calculation
  const getRemainingTimeText = () => {
    if (!resolvedExpiry) return 'N/A';
    const diffMs = resolvedExpiry - new Date();
    if (diffMs <= 0) return 'Expired';
    
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 1) {
      const mins = Math.round(diffHours * 60);
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(diffHours);
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days} day${days !== 1 ? 's' : ''} ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`;
  };

  const remainingText = getRemainingTimeText();

  // Status-based accent borders and background shadows
  const statusColors = {
    'Fresh': 'border-emerald-100 bg-emerald-50/10 shadow-emerald-50/30',
    'Consume Soon': 'border-amber-100 bg-amber-50/10 shadow-amber-50/30',
    'Near Expiry': 'border-orange-100 bg-orange-50/10 shadow-orange-50/30',
    'Expired': 'border-rose-100 bg-rose-50/10 shadow-rose-50/30'
  };

  const activeColorTheme = statusColors[resolvedStatus] || statusColors['Fresh'];

  return (
    <div className={`rounded-3xl border p-6 shadow-sm transition-all duration-300 ${activeColorTheme}`}>
      {/* Card Header */}
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              AI Freshness Engine
              {isLivePreview && (
                <span className="text-[10px] font-medium bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Live Preview
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Smart Shelf-Life Analysis</p>
          </div>
        </div>
        <FreshnessBadge status={resolvedStatus} />
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Section: Key Analytics */}
        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Estimated Shelf Life Remaining
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black tracking-tight ${
                resolvedStatus === 'Fresh' ? 'text-emerald-600' :
                resolvedStatus === 'Consume Soon' ? 'text-amber-600' :
                resolvedStatus === 'Near Expiry' ? 'text-orange-600' : 'text-rose-600'
              }`}>
                {remainingText}
              </span>
            </div>
            {resolvedExpiry && resolvedStatus !== 'Expired' && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Expires: {resolvedExpiry.toLocaleString(undefined, { 
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </p>
            )}
          </div>

          {/* Freshness Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-slate-500">Freshness Integrity</span>
              <span className="font-extrabold text-slate-800">{resolvedScore}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  resolvedScore >= 80 ? 'bg-emerald-500' :
                  resolvedScore >= 50 ? 'bg-amber-500' :
                  resolvedScore > 0 ? 'bg-orange-500' : 'bg-rose-500'
                }`}
                style={{ width: `${resolvedScore}%` }}
              />
            </div>
          </div>

          {/* Preparation Details */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prepared on</p>
              <p className="text-xs font-bold text-slate-700">{prepString}</p>
            </div>
          </div>
        </div>

        {/* Right Section: Storage & Environment Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Storage Type */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Storage Mode</span>
              <span className="text-xs font-extrabold text-slate-800">{resolvedStorage}</span>
            </div>

            {/* Current Temperature */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Current Temp</span>
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                {resolvedTemp}°C
              </span>
            </div>
          </div>

          {/* Temp Warning / Ideal Info */}
          {hasTempPenalty ? (
            <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 animate-bounce" />
              <div className="text-xs">
                <p className="font-bold text-amber-800">Decay Acceleration Active</p>
                <p className="text-amber-700/90 text-[11px] leading-relaxed mt-0.5">
                  Stored at {resolvedTemp}°C which exceeds the ideal range for {category || 'this category'} (ideal: {idealTemp}°C). Decay rate is higher.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200/50 rounded-2xl p-3.5 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-emerald-800">Ideal Conditions</p>
                <p className="text-emerald-700/90 text-[11px] leading-relaxed mt-0.5">
                  Storage temperature is within the safety threshold for optimal preservation.
                </p>
              </div>
            </div>
          )}

          {/* Actionable storage advice */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700">Storage Guidance:</span> {getStorageAdvice(resolvedStorage)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
