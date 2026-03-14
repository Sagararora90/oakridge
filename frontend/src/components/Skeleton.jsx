import React from 'react';

const Skeleton = ({ className, style }) => (
  <div 
    className={`animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-md ${className}`} 
    style={{ ...style }}
  />
);

export const StatSkeleton = () => (
  <div className="bg-card-bg border-[0.5px] border-border rounded-xl p-4 flex flex-col gap-3">
    <Skeleton className="w-6 h-6 rounded-lg" />
    <Skeleton className="w-16 h-8 rounded-lg" />
    <Skeleton className="w-24 h-3 rounded-md" />
  </div>
);

export const SlotSkeleton = () => (
  <div className="bg-card-bg border-[0.5px] border-border rounded-lg p-3.5 mb-2 flex items-center gap-3">
    <Skeleton className="w-10 h-4 rounded-md" />
    <Skeleton className="flex-1 h-4 rounded-md" />
    <Skeleton className="w-16 h-5 rounded-full" />
  </div>
);

export const SubjectCardSkeleton = () => (
  <div className="bg-card-bg border-[0.5px] border-border rounded-2xl p-5 flex flex-col gap-4">
    <div className="flex justify-between items-start gap-4">
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="w-32 h-5 rounded-md" />
        </div>
        <Skeleton className="w-20 h-3 rounded-md" />
      </div>
      <Skeleton className="w-12 h-10 rounded-lg" />
    </div>
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <Skeleton className="w-16 h-3 rounded-md" />
        <Skeleton className="w-24 h-3 rounded-md" />
      </div>
      <Skeleton className="w-full h-1.5 rounded-full" />
    </div>
    <Skeleton className="w-full h-12 rounded-xl" />
    <div className="flex gap-2">
      <Skeleton className="flex-1 h-10 rounded-xl" />
      <Skeleton className="flex-1 h-10 rounded-xl" />
      <Skeleton className="w-10 h-10 rounded-xl" />
    </div>
  </div>
);

export default Skeleton;
