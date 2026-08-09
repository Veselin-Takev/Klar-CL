import { useState } from 'react';
import { Play, Sparkles } from 'lucide-react';

interface RewardedAdButtonProps {
  onRewardEarned: () => void;
  label?: string;
  className?: string;
}

export function RewardedAdButton({ onRewardEarned, label = "Video ansehen (+3 Kontakte)", className = "" }: RewardedAdButtonProps) {
  const [isWatching, setIsWatching] = useState(false);

  const handleWatchAd = () => {
    setIsWatching(true);
    
    // Simulate AdMob rewarded video
    // In a real app, this would use google-mobile-ads SDK
    setTimeout(() => {
      setIsWatching(false);
      onRewardEarned();
    }, 3000);
  };

  return (
    <button
      onClick={handleWatchAd}
      disabled={isWatching}
      className={`relative overflow-hidden group ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-rose-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      
      <div className="relative flex items-center justify-center gap-2 text-white font-medium">
        {isWatching ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Video läuft...
          </span>
        ) : (
          <>
            <Play size={18} className="fill-white" />
            {label}
            <Sparkles size={16} className="text-amber-200" />
          </>
        )}
      </div>
    </button>
  );
}
