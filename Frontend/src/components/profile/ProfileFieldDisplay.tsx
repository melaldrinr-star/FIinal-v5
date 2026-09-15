import React from 'react';

interface ProfileFieldDisplayProps {
  label: string;
  value?: string | React.ReactNode;
  className?: string;
}

export function ProfileFieldDisplay({
  label,
  value,
  className = '',
}: ProfileFieldDisplayProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      <p className="text-sm font-medium text-foreground">
        {value || <span className="text-muted-foreground italic">Not provided</span>}
      </p>
    </div>
  );
}
