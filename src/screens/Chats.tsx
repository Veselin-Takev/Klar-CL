import { Link } from "react-router";
import { allProfiles } from "../data";
import { Clock, ShieldCheck, Heart } from "lucide-react";
import { RewardedAdButton } from "../components/RewardedAdButton";

export default function Chats() {
  return (
    <div className="p-6 h-full overflow-y-auto pb-24 bg-light-bg dark:bg-dark-bg">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-3xl font-serif text-stone-900 dark:text-stone-100">Deine Verbindungen</h1>
        <Link to="/profile" className="flex items-center gap-1.5 text-brand dark:text-brand-light text-sm font-medium bg-brand/10 dark:bg-brand-light/10 px-3 py-1.5 rounded-full hover:bg-brand/20 dark:hover:bg-brand-light/20 transition-colors">
          <ShieldCheck size={16} /> Verifiziert
        </Link>
      </div>


      <div className="mb-6">
        <RewardedAdButton 
          onRewardEarned={() => {
            alert("Gratuliere! Du hast 3 zusätzliche Kontakte erhalten.");
            // Actual API integration would happen here
          }} 
          className="w-full py-4 rounded-xl shadow-md"
        />
      </div>
  
      {/* Premium Feature Teaser */}
      <div className="mb-6 p-4 rounded-2xl border border-stone-200 dark:border-stone-700  from-stone-50 to-stone-100 dark:from-stone-900 dark:to-stone-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 dark:bg-brand-light/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-black rounded-full flex items-center justify-center border border-stone-200 dark:border-stone-800 shadow-sm">
              <Heart size={20} className="text-rose-500 fill-rose-500/20" />
            </div>
            <div>
              <h3 className="font-medium text-stone-900 dark:text-stone-100">3 Personen mögen dich</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">Hol dir Klar Premium, um sie zu sehen</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-full text-xs font-medium hover:opacity-90 transition-opacity">
             Premium
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {allProfiles.map((profile, i) => (
          <Link to={`/chat/${profile.id}`} key={profile.id} className="flex items-center gap-4 p-4 bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 hover:border-brand/50 dark:hover:border-brand-light/50 transition-colors group">
                        <div className="relative">
              <img src={profile.photoUrl} alt={profile.name} className="w-16 h-16 rounded-full object-cover border border-stone-100 dark:border-stone-800" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-stone-900 rounded-full"></div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-lg text-stone-900 dark:text-stone-100">{profile.name}</h3>
                <span className="text-xs text-stone-400 dark:text-stone-500">{i + 1}h</span>
              </div>
              <p className="text-stone-500 dark:text-stone-400 text-sm mb-2 truncate">Tippe, um ein Gespräch zu beginnen...</p>
              <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-500 uppercase tracking-wider">
                <Clock size={12} />
                <span>Verfällt in {72 - (i * 2)}h</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
               <div className="w-12 h-12 relative flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-stone-100 dark:text-stone-800"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="text-brand dark:text-brand-light"
                      strokeDasharray={`${75 + i * 5}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-stone-700 dark:text-stone-300">{75 + i * 5}%</span>
               </div>
               <span className="text-[8px] text-stone-500 font-medium uppercase mt-1">Fit</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
