import React from 'react';

interface ProfilePlanBannerProps {
  airline: string;
  position: string;
}

export function ProfilePlanBanner({ airline, position }: ProfilePlanBannerProps) {
  return (
    <div className="bg-muted/50 p-4 rounded-lg mb-10 flex items-center text-sm">
      <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded mr-3 text-xs uppercase">
        Current Plan
      </span>
      <p className="text-foreground">
        You're on the <span className="font-semibold">{airline || 'Standard'}</span> plan 
        {position ? <span> as <span className="font-semibold">{position}</span></span> : ''}.
      </p>
    </div>
  );
}
