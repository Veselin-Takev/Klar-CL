import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-stone-200 dark:bg-stone-700 rounded-xl ${className}`}></div>
);
