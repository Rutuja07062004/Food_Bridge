import React from 'react';
import { Check, Clock, X, MapPin, Calendar, ClipboardCheck } from 'lucide-react';

const ClaimTimeline = ({ status, pickupDate, pickupTime, pickupInstructions, collectedAt, completedAt, createdAt }) => {
  // Define mapping for statuses
  const statusOrder = ['CLAIM_REQUESTED', 'APPROVED', 'READY_FOR_PICKUP', 'COLLECTED', 'COMPLETED'];
  
  const currentStepIndex = statusOrder.indexOf(status);
  const isRejected = status === 'REJECTED';

  const steps = [
    {
      id: 'CLAIM_REQUESTED',
      title: 'Claim Submitted',
      description: 'NGO requested the surplus food donation.',
      time: createdAt ? new Date(createdAt).toLocaleString() : null
    },
    {
      id: 'APPROVED',
      title: 'Request Approved',
      description: 'Donor verified and approved the redistribution claim.',
      time: null // Available after approval
    },
    {
      id: 'READY_FOR_PICKUP',
      title: 'Ready for Pickup',
      description: 'Donor prepared the food and scheduled the pickup window.',
      time: pickupDate ? `${new Date(pickupDate).toLocaleDateString()} at ${pickupTime}` : null
    },
    {
      id: 'COLLECTED',
      title: 'Food Collected',
      description: 'NGO collected the surplus food from donor location.',
      time: collectedAt ? new Date(collectedAt).toLocaleString() : null
    },
    {
      id: 'COMPLETED',
      title: 'Handover Complete',
      description: 'Donor verified successful distribution of surplus servings.',
      time: completedAt ? new Date(completedAt).toLocaleString() : null
    }
  ];

  return (
    <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-slate-50 pb-4">
        <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Claims Progress Tracker</h4>
        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
          isRejected ? 'bg-rose-50 border-rose-200 text-rose-700' :
          status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 animate-pulse' :
          'bg-emerald-50 border-emerald-100 text-emerald-600'
        }`}>
          Status: {status?.replace('_', ' ')}
        </span>
      </div>

      <div className="relative pl-8 space-y-8">
        {/* Connection Line */}
        <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />

        {steps.map((step, idx) => {
          const isCompleted = !isRejected && currentStepIndex >= idx;
          const isActive = !isRejected && currentStepIndex === idx;
          const isFuture = !isRejected && currentStepIndex < idx;

          // Handle special rejected state rendering
          let iconBg = 'bg-slate-100 text-slate-400';
          let iconChild = <Clock className="w-4 h-4" />;
          let borderCls = 'border-slate-200';

          if (isCompleted) {
            iconBg = 'bg-emerald-500 text-white';
            iconChild = <Check className="w-4 h-4" />;
            borderCls = 'border-emerald-500';
          } else if (isActive) {
            iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-500 ring-4 ring-emerald-50';
            iconChild = <Clock className="w-4 h-4" />;
            borderCls = 'border-emerald-400';
          }

          if (isRejected && idx === 1) {
            iconBg = 'bg-rose-500 text-white';
            iconChild = <X className="w-4 h-4" />;
            borderCls = 'border-rose-500';
          }

          return (
            <div key={step.id} className="relative flex flex-col md:flex-row md:items-start gap-4">
              {/* Dot Icon Overlay */}
              <div className={`absolute -left-[29px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${iconBg} z-10 transition-all duration-300`}>
                {iconChild}
              </div>

              {/* Step Info */}
              <div className="flex-1">
                <h5 className={`font-bold text-sm ${isActive ? 'text-emerald-700' : isRejected && idx === 1 ? 'text-rose-600' : 'text-slate-800'}`}>
                  {isRejected && idx === 1 ? 'Request Rejected' : step.title}
                </h5>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {isRejected && idx === 1 ? 'The food redistributor declined the surplus claim request.' : step.description}
                </p>

                {/* Date display */}
                {step.time && (
                  <span className="inline-block text-[10px] text-slate-400 font-bold bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 mt-1.5">
                    {step.time}
                  </span>
                )}

                {/* Additional conditional instructions display */}
                {step.id === 'READY_FOR_PICKUP' && statusOrder.indexOf(status) >= 2 && pickupInstructions && (
                  <div className="mt-3 p-3 bg-amber-50/50 border border-amber-100 rounded-2xl text-xs text-slate-600 space-y-1.5 max-w-md">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Pickup Instructions:</span>
                    </div>
                    <p className="leading-relaxed">{pickupInstructions}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClaimTimeline;
