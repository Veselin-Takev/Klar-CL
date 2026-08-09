
import { Skeleton } from './Skeleton';

export const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6 p-4 pt-16">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
    
    <div className="flex gap-4 overflow-x-hidden">
       <Skeleton className="h-32 w-2/3 shrink-0 rounded-2xl" />
       <Skeleton className="h-32 w-2/3 shrink-0 rounded-2xl" />
    </div>

    <Skeleton className="h-6 w-1/4 mt-4" />
    <div className="flex flex-col gap-4">
      <Skeleton className="h-96 w-full rounded-3xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="flex flex-col gap-6 p-4 pt-16">
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="h-24 w-24 rounded-full" />
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    
    <div className="space-y-4 mt-4">
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  </div>
);
