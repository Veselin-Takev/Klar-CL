export function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 p-4 pb-20 max-w-2xl mx-auto w-full animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="w-48 h-8 bg-stone-200 rounded-md"></div>
        <div className="flex gap-2">
           <div className="w-8 h-8 bg-stone-200 rounded-full"></div>
           <div className="w-8 h-8 bg-stone-200 rounded-full"></div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="h-40 bg-stone-200 rounded-2xl"></div>
        <div className="grid grid-cols-2 gap-4">
           <div className="h-32 bg-stone-200 rounded-2xl"></div>
           <div className="h-32 bg-stone-200 rounded-2xl"></div>
        </div>
        <div className="h-48 bg-stone-200 rounded-2xl"></div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="pb-24 pt-4 px-4 bg-stone-50 max-w-2xl mx-auto min-h-screen animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="w-10 h-10 bg-stone-200 rounded-full"></div>
        <div className="w-32 h-6 bg-stone-200 rounded-md"></div>
        <div className="w-10 h-10 bg-stone-200 rounded-full"></div>
      </div>
      
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 bg-stone-200 rounded-full mb-4"></div>
        <div className="w-40 h-8 bg-stone-200 rounded-md mb-2"></div>
        <div className="w-24 h-4 bg-stone-200 rounded-md"></div>
      </div>
      
      <div className="space-y-6">
        <div className="h-32 bg-stone-200 rounded-2xl"></div>
        <div className="h-64 bg-stone-200 rounded-2xl"></div>
      </div>
    </div>
  );
}
