// @ts-nocheck
import { useUsageAnalytics } from "../lib/useUsageAnalytics";
import { useState, useEffect, useMemo } from "react";
import { allProfiles } from "../data";
import type { Profile } from "../data";
import { Info, X, Heart, BatteryFull, BatteryMedium, BatteryLow, Sparkles, Filter, ShieldCheck, MapPin, ChevronDown, Star, Sun, Moon } from "lucide-react";
import { MatchCompatibilityInsights } from "../components/MatchCompatibilityInsights";
import { VerbindungOptimizerWidget } from "../components/VerbindungOptimizerWidget";
import { calculateMatchScore, isInterestShared, calculateDeepMatch } from "../services/matchScore";
import { hapticFeedback, HAPTIC_PATTERNS } from "../lib/haptics";
import { sortProfilesByRecommendation, recordInteraction } from "../services/recommendationEngine";
import { motion, AnimatePresence } from "motion/react";
import { DailyPulseWidget } from "../components/DailyPulseWidget";
import { SocialEnergyWidget } from "../components/SocialEnergyWidget";
import { UpcomingDateWidget } from "../components/UpcomingDateWidget";
import { DailyGoalTracker } from "../components/DailyGoalTracker";
import { WeeklyConsistencyTracker } from "../components/WeeklyConsistencyTracker";
import { DailyAffirmationWidget } from "../components/DailyAffirmationWidget";
import { TrendingInterestsWidget } from "../components/TrendingInterestsWidget";
import { SuccessDashboardWidget } from "../components/SuccessDashboardWidget";
import { DatingGoalProgressWidget } from "../components/DatingGoalProgressWidget";
import { PrePostDateVibeWidget } from "../components/PrePostDateVibeWidget";
import { MonthlyMoodAreaWidget } from "../components/MonthlyMoodAreaWidget";
import { DateTypePieChartWidget } from "../components/DateTypePieChartWidget";
import { MoodInsightWidget } from "../components/MoodInsightWidget";
import { MiniCalendarWidget } from "../components/MiniCalendarWidget";

import { SmartVorschlaegeWidget } from "../components/SmartVorschlaegeWidget";
import { DateSuccessRadarWidget } from "../components/DateSuccessRadarWidget";
import { DashboardDateBanner } from "../components/DashboardDateBanner";
import { AICoachMoodCheckWidget } from "../components/AICoachMoodCheckWidget";
import { ReflectionInsightDashboard } from "../components/ReflectionInsightDashboard";

import { DatingGoalRoadmapWidget } from "../components/DatingGoalRoadmapWidget";
import { DatingSuccessArchiveWidget } from "../components/DatingSuccessArchiveWidget";
import { DatingKarmaWidget } from "../components/DatingKarmaWidget";
import { WeeklyMoodSummaryWidget } from "../components/WeeklyMoodSummaryWidget";

import { Focus, Lock } from "lucide-react";
import { QuickThemeToggle } from "../components/QuickThemeToggle";
import { DatingProgressChartWidget } from "../components/DatingProgressChartWidget";
import { WeeklyTimelineWidget } from "../components/WeeklyTimelineWidget";
import { ProfileCheckWidget } from "../components/ProfileCheckWidget";
import { QuickPreparationCountdownWidget } from "../components/QuickPreparationCountdownWidget";
import { ConversationStatsWidget } from "../components/ConversationStatsWidget";
import { DatePlannerWidget } from "../components/DatePlannerWidget";
import { CityTrendRadarWidget } from "../components/CityTrendRadarWidget";
import { DateReflectionJournalWidget } from "../components/DateReflectionJournalWidget";
import { PastDatesArchiveWidget } from "../components/PastDatesArchiveWidget";
import { DateMemoriesWidget } from "../components/DateMemoriesWidget";
import { DatingHappinessScoreWidget } from "../components/DatingHappinessScoreWidget";
import { VerbindungContextAnalysisWidget } from "../components/VerbindungContextAnalysisWidget";
import { SmartVibeMapWidget } from "../components/SmartVibeMapWidget";
import { DatingFocusModeWidget } from "../components/DatingFocusModeWidget";
import { BreathingExerciseWidget } from "../components/BreathingExerciseWidget";
import { DatingVibeAnalyzerWidget } from "../components/DatingVibeAnalyzerWidget";
import { DailyPromptWidget } from "../components/DailyPromptWidget";
import { WeeklyMilestoneRevealWidget } from "../components/WeeklyMilestoneRevealWidget";
import { DailyVibeCheckWidget } from "../components/DailyVibeCheckWidget";
import { MatchIcebreakersWidget } from "../components/MatchIcebreakersWidget";
import { SituationalIcebreakerWidget } from "../components/SituationalIcebreakerWidget";
import { DateRatingChartWidget } from "../components/DateRatingChartWidget";
import { DateSuccessTrendWidget } from "../components/DateSuccessTrendWidget";
import { YearInReviewWidget } from "../components/YearInReviewWidget";
import { DatingSuccessScoreWidget } from "../components/DatingSuccessScoreWidget";
import { DatingHealthWidget } from "../components/DatingHealthWidget";
import { DatingRitualWidget } from "../components/DatingRitualWidget";
import { MatchCompassWidget } from "../components/MatchCompassWidget";
import { SmartDatePlannerWidget } from "../components/SmartDatePlannerWidget";
import { MoodDiaryReminder } from "../components/MoodDiaryReminder";
import { CityInsiderWidget } from "../components/CityInsiderWidget";
import { SmartDatingDiaryWidget } from "../components/SmartDatingDiaryWidget";
import { DateDiaryStatsWidget } from "../components/DateDiaryStatsWidget";
import { ClarityScoreWidget } from "../components/ClarityScoreWidget";
import { SuccessRadarWidget } from "../components/SuccessRadarWidget";
import { DatingTimelineWidget } from "../components/DatingTimelineWidget";
import { WeeklyConsistencyWidget } from "../components/WeeklyConsistencyWidget";
import { NextDateWidget } from "../components/NextDateWidget";
import { DailyGoalRingsWidget } from "../components/DailyGoalRingsWidget";
import { DateMoodStreakWidget } from "../components/DateMoodStreakWidget";
import { DatingReadinessWidget } from "../components/DatingReadinessWidget";
import { DailyCoachInsightWidget } from "../components/DailyCoachInsightWidget";
import { DateMoodChartWidget } from "../components/DateMoodChartWidget";
import { SmartVerbindungBadgeWidget } from "../components/SmartVerbindungBadgeWidget";
import { DatingMilestonesWidget } from "../components/DatingMilestonesWidget";
import { SmartDateReminderWidget } from "../components/SmartDateReminderWidget";
import { DataExportWidget } from "../components/DataExportWidget";
import { DatePreparationChecklistWidget } from "../components/DatePreparationChecklistWidget";
import { PreDateChecklistWidget } from "../components/PreDateChecklistWidget";
import { ReflectionLogWidget } from "../components/ReflectionLogWidget";
import { NextDateCountdownWidget } from "../components/NextDateCountdownWidget";
import { SafeDatePlannerWidget } from "../components/SafeDatePlannerWidget";
import { CompatibilityRadarWidget } from "../components/CompatibilityRadarWidget";
import { MoodMonitorWidget } from "../components/MoodMonitorWidget";
import { DailyMoodCheckInWidget } from "../components/DailyMoodCheckInWidget";
import { SmartMatchFilter, LIFE_GOALS, COMMUNICATION_STYLES } from "../components/SmartMatchFilter";
import { ValuesQuizWidget } from "../components/ValuesQuizWidget";
import { WeeklySuccessSummaryWidget } from "../components/WeeklySuccessSummaryWidget";
import { DatingWheelStatsWidget } from "../components/DatingWheelStatsWidget";
import { fetchProfileSummary, askAICoach } from "../lib/api";
import { VerbindungScoreBadge } from "../components/VerbindungScoreBadge";
import { isSmartMatchEnabled, checkNewProfilesForSmartMatches } from "../services/smartMatchService";
import { SmartVerbindungTutorialOverlay } from "../components/SmartVerbindungTutorialOverlay";
import { SmartVerbindungCarousel } from "../components/SmartVerbindungCarousel";
import { KlarMatchWidget } from "../components/KlarMatchWidget";
import { DatingWheelWidget } from "../components/DatingWheelWidget";
import { WheelStatsWidget } from "../components/WheelStatsWidget";
import { SuccessSummaryWidget } from "../components/SuccessSummaryWidget";
import { DailyMoodWidget } from "../components/DailyMoodWidget";
import { TodayFeelingTrackerWidget } from "../components/TodayFeelingTrackerWidget";
import { MiniDiaryWidget } from "../components/MiniDiaryWidget";
import { DatingMilestones } from "../components/DatingMilestones";
import { DatingDuelWidget } from "../components/DatingDuelWidget";
import { RecentIntrosWidget } from "../components/RecentIntrosWidget";
import { Confetti } from "../components/Confetti";
import { MoodDiaryWidget } from "../components/MoodDiaryWidget";
import { PopularDateIdeasWidget } from "../components/PopularDateIdeasWidget";
import { DailyIcebreakerWidget } from "../components/DailyIcebreakerWidget";
import { RelationshipJourneyWidget } from "../components/RelationshipJourneyWidget";
import { DailyCoachAffirmation } from "../components/DailyCoachAffirmation";
import { AppTour } from "../components/AppTour";
import { EmailSummaryWidget } from "../components/EmailSummaryWidget";
import { QualityConversationsChartWidget } from "../components/QualityConversationsChartWidget";
import { DatingJournalWidget } from "../components/DatingJournalWidget";
import { KlarCompassWidget } from "../components/KlarCompassWidget";
import { WeeklyVibesWidget } from "../components/WeeklyVibesWidget";
import { DateInspirationTab } from "../components/DateInspirationTab";
import { melde } from "../lib/fehler";

const DAILY_LIMIT = 8;

const cityCoordinates: Record<string, {lat: number, lng: number}> = {
  "Berlin": { lat: 52.5200, lng: 13.4050 },
  "München": { lat: 48.1351, lng: 11.5820 },
  "Hamburg": { lat: 53.5511, lng: 9.9937 },
  "Köln": { lat: 50.9375, lng: 6.9603 },
  "Wien": { lat: 48.2082, lng: 16.3738 },
  "Zürich": { lat: 47.3769, lng: 8.5417 }
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

export default function Dashboard() {
  const { trackEvent } = useUsageAnalytics();
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [activeTab, setActiveTab] = useState<"discover" | "inspiration">("discover");

  

  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [contactsLeft, setContactsLeft] = useState(DAILY_LIMIT);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userNoGos, setUserNoGos] = useState<string[]>([]);
  const [noGoStrictness, setNoGoStrictness] = useState<number>(() => {
    const saved = localStorage.getItem("noGoStrictness");
    return saved ? parseInt(saved) : 100;
  });

  
  
  
  
  
  const [weeklyReview, setWeeklyReview] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isSmartLockEnabled, setIsSmartLockEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  useEffect(() => {
    // If smart lock is enabled, we could lock if a date is soon, but for demo we just show the toggle
    if (isSmartLockEnabled) {
      // simulated check

    }
  }, [isSmartLockEnabled]);

  if (isLocked) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-stone-900 text-white p-6 relative z-50">
        <Lock size={48} className="text-brand mb-4 opacity-80" />
        <h2 className="text-xl font-bold mb-2">Smart-Lock Aktiv</h2>
        <p className="text-stone-400 text-center text-sm mb-8">Deine Privatsphäre ist geschützt. Bitte entsperren (PIN / FaceID).</p>
        <button onClick={() => setIsLocked(false)} className="px-8 py-3 bg-brand text-white rounded-full font-medium shadow-lg">
          Entsperren (Demo)
        </button>
      </div>
    );
  }

  const [isFetchingReview, setIsFetchingReview] = useState(false);
  const [newDeepMatchAlert, setNewDeepMatchAlert] = useState(false);
  const [deepMatchCount, setDeepMatchCount] = useState<number>(0);
  
  
  
    
  const [mustHaveInterests, setMustHaveInterests] = useState<string[]>([]);
  const [showHighVerbindungenOnly, setShowHighVerbindungenOnly] = useState(false);
  const [highCompatibilityFirst, setHighCompatibilityFirst] = useState(false);
  const [prioritizeInterests, setPrioritizeInterests] = useState(false);
  const [matchIntensity, setMatchIntensity] = useState<number>(0);
  const [notifiedHighVerbindungen, setNotifiedHighVerbindungen] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ id: string, message: string, onUndo?: () => void } | null>(null);
  
  const [profileSummary, setProfileSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  
  const [filterLocation, setFilterLocation] = useState<string | null>(null);
  const [filterSharedHobbies, setFilterSharedHobbies] = useState<boolean>(false);
  const [filterSharedGoals, setFilterSharedGoals] = useState<boolean>(false);
  const [filterSharedCommunication, setFilterSharedCommunication] = useState<boolean>(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [filterMaxDistance, setFilterMaxDistance] = useState<number>(100);
  const [filterMinAge, setFilterMinAge] = useState<number>(18);
  const [filterMaxAge, setFilterMaxAge] = useState<number>(99);
  const [filterSpecificInterest, setFilterSpecificInterest] = useState<string>("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('klar_search_history') || '[]');
    setSearchHistory(history);
  }, []);
  
  const saveSearchHistory = (search: string) => {
    if (!search.trim()) return;
    const history = [search.trim(), ...searchHistory.filter(s => s !== search.trim())].slice(0, 5);
    setSearchHistory(history);
    localStorage.setItem('klar_search_history', JSON.stringify(history));
  };
  const [modalProfile, setModalProfile] = useState<Profile | null>(null);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [generatedIcebreaker, setGeneratedIcebreaker] = useState<string | null>(null);
  const [isGeneratingIcebreaker, setIsGeneratingIcebreaker] = useState(false);
  const [smartMatchEnabledState, setSmartMatchEnabledState] = useState(isSmartMatchEnabled());
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [showSmartMatchTooltip, setShowSmartMatchTooltip] = useState(false);
  const [smartMatchDetailProfile, setSmartMatchDetailProfile] = useState<Profile | null>(null);
  const [celebratedProfiles, setCelebratedProfiles] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [roadmapMilestone, setRoadmapMilestone] = useState(0);

  const [aiFilterMode, setAiFilterMode] = useState<boolean>(false);
  const [aiMatchScores, setAiMatchScores] = useState<Record<string, { score: number, reason: string }> | null>(null);
  const [isCalculatingAiScores, setIsCalculatingAiScores] = useState(false);

  useEffect(() => {
    const updateMilestone = () => {
      const saved = localStorage.getItem('klar_dating_roadmap');
      if (saved) {
        try {
          const completed = JSON.parse(saved);
          setRoadmapMilestone(completed.length);
            } catch (e) {}
      }
    };

    updateMilestone();
    window.addEventListener('roadmapProgressChanged', updateMilestone);
    
  return () => window.removeEventListener('roadmapProgressChanged', updateMilestone);
  }, []);

  const getBackgroundMilestoneClass = () => {
    if (roadmapMilestone >= 5) return "bg-emerald-50 dark:bg-emerald-950/20";
    if (roadmapMilestone >= 3) return "bg-indigo-50 dark:bg-indigo-950/20";
    if (roadmapMilestone >= 1) return "bg-amber-50 dark:bg-amber-950/20";
    return "bg-light-bg dark:bg-dark-bg";
  };

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    window.addEventListener('themechange', handleThemeChange);
    // Also listen to mutation observer for direct class changes just in case
    const observer = new MutationObserver(() => handleThemeChange());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      window.removeEventListener('themechange', handleThemeChange);
      observer.disconnect();
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new Event('themechange'));
  };

  useEffect(() => {
    const handleSettingsChange = () => {
      setSmartMatchEnabledState(isSmartMatchEnabled());
    };
    window.addEventListener('smartMatchSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('smartMatchSettingsChanged', handleSettingsChange);
  }, []);
  
  const uniqueLocations = useMemo(() => Array.from(new Set(allProfiles.map(p => p.location).filter(Boolean))), []);


  useEffect(() => {
    const seen = localStorage.getItem('klar_walkthrough_seen');
    if (!seen) {
      setTimeout(() => setWalkthroughStep(1), 1000);

    
    }
    // Request notification permission for push notifications
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

  }, []);

  const nextWalkthroughStep = () => {
    if (walkthroughStep === 1) {
      setWalkthroughStep(2);
    } else if (walkthroughStep === 2) {
      setWalkthroughStep(0);
      localStorage.setItem('klar_walkthrough_seen', 'true');
    }
  };

  const skipWalkthrough = () => {
    setWalkthroughStep(0);
    localStorage.setItem('klar_walkthrough_seen', 'true');
  };

  useEffect(() => {
    // Try to load from localStorage
    const savedContacts = localStorage.getItem('klar_contacts_left');
    const savedDate = localStorage.getItem('klar_contacts_date');
    const savedSeenIds = localStorage.getItem('klar_seen_ids');
    const today = new Date().toDateString();

    if (savedDate === today && savedContacts !== null) {
      setContactsLeft(parseInt(savedContacts, 10));
      if (savedSeenIds) {
        try {
          setSeenIds(JSON.parse(savedSeenIds));
            } catch (e) {}
      }
    } else {
  
      // Reset for a new day
      setContactsLeft(DAILY_LIMIT);
      localStorage.setItem('klar_contacts_date', today);
      localStorage.setItem('klar_contacts_left', DAILY_LIMIT.toString());
      localStorage.removeItem('klar_seen_ids');


    }
    try {
      const interests = localStorage.getItem("userInterests");
      if (interests) {
        setUserInterests(JSON.parse(interests));
      }
  
      const mustHaves = localStorage.getItem("mustHaveInterests");
      if (mustHaves) {
        setMustHaveInterests(JSON.parse(mustHaves));
      }
  
    } catch (e) {
      melde("Dashboard", e);

    }
  }, []);

  useEffect(() => {
    let watchId: number;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
              });
            },
        (error) => {
          console.warn("Error getting location", error);
            },
        { enableHighAccuracy: true }
      );

    }
    return () => {
      if (watchId !== undefined && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
  
      }
    };
  }, []);

  const availableProfiles = useMemo(() => {
    let profiles = allProfiles.filter(p => !seenIds.includes(p.id));
    if (showHighVerbindungenOnly) {
      profiles = profiles.filter(p => calculateMatchScore(userInterests, p.interests) >= 80);
    }

    
    if (filterLocation) {
      profiles = profiles.filter(p => p.location === filterLocation);
    }

    
    // Distance filter
    if (userCoords && filterMaxDistance < 100) {
      profiles = profiles.filter(p => {
        const cityCoord = cityCoordinates[p.location];
        if (!cityCoord) return true; // fallback
        const dist = calculateDistance(userCoords.lat, userCoords.lng, cityCoord.lat, cityCoord.lng);
        return dist <= filterMaxDistance;
      });
    }


    // Age filter
    profiles = profiles.filter(p => p.age >= filterMinAge && p.age <= filterMaxAge);

    // Specific interest filter
    if (filterSpecificInterest.trim()) {
      const search = filterSpecificInterest.toLowerCase().trim();
      profiles = profiles.filter(p => 
        p.interests.some(i => i.toLowerCase().includes(search)) || 
        p.bio.toLowerCase().includes(search)
      );
    }


    
    if (filterSharedHobbies) {
      const userHobbies = userInterests.filter(i => !LIFE_GOALS.includes(i) && !COMMUNICATION_STYLES.includes(i));
      profiles = profiles.filter(p => p.interests.some(i => userHobbies.includes(i)));
    }
    
    if (filterSharedGoals) {
      const userGoal = localStorage.getItem("userGoal") || "";
      const userGoalsList = userInterests.filter(i => LIFE_GOALS.includes(i));
      profiles = profiles.filter(p => 
        p.interests.some(i => userGoalsList.includes(i)) || 
        (userGoal && p.bio.toLowerCase().includes(userGoal.toLowerCase())) || 
        (userGoal && p.interests.some(i => i.toLowerCase().includes(userGoal.toLowerCase())))
      );
    }

    if (filterSharedCommunication) {
      const userCommStyles = userInterests.filter(i => COMMUNICATION_STYLES.includes(i));
      profiles = profiles.filter(p => p.interests.some(i => userCommStyles.includes(i)));
    }
    
    if (matchIntensity > 0 && userInterests.length > 0) {
      profiles = profiles.filter(p => calculateMatchScore(userInterests, p.interests) >= matchIntensity);
    }
    
    let sortedProfiles = sortProfilesByRecommendation(profiles, userInterests, mustHaveInterests);
    
    if (highCompatibilityFirst) {
      sortedProfiles = sortedProfiles.sort((a, b) => {
        const aMustHaves = a.interests.filter(i => mustHaveInterests.includes(i)).length;
        const bMustHaves = b.interests.filter(i => mustHaveInterests.includes(i)).length;
        
        const weightA = (aMustHaves * 100) + calculateMatchScore(userInterests, a.interests);
        const weightB = (bMustHaves * 100) + calculateMatchScore(userInterests, b.interests);
        
        return weightB - weightA;
      });
    }

    
    if (prioritizeInterests && userInterests.length > 0) {
      sortedProfiles = sortedProfiles.sort((a, b) => {
        const sharedA = a.interests.filter(i => userInterests.includes(i)).length;
        const sharedB = b.interests.filter(i => userInterests.includes(i)).length;
        return sharedB - sharedA;
      });
    }


    if (aiFilterMode && aiMatchScores) {
      sortedProfiles = sortedProfiles
        .filter(p => aiMatchScores && aiMatchScores[p.id])
        .sort((a, b) => aiMatchScores![b.id]!.score - aiMatchScores![a.id]!.score);
    }



    return sortedProfiles;
  }, [seenIds, showHighVerbindungenOnly, highCompatibilityFirst, userInterests, mustHaveInterests, filterLocation, filterSharedHobbies, filterSharedGoals, filterSharedCommunication, filterMaxDistance, filterMinAge, filterMaxAge, filterSpecificInterest, userCoords, aiFilterMode, aiMatchScores]);

  // Automated background check for Smart-Verbindunges and regular notifications
  useEffect(() => {
    if (smartMatchEnabledState) {
      // Find all unnotified profiles with score >= 90
      const highVerbindungen = checkNewProfilesForSmartMatches(availableProfiles, userInterests, notifiedHighVerbindungen);
      if (highVerbindungen.length > 0) {
        // Mark them as notified
        const newNotified = new Set(notifiedHighVerbindungen);
        highVerbindungen.forEach(p => newNotified.add(p.id));
        setNotifiedHighVerbindungen(newNotified);
        
        // If we have more than one, consolidate notification
        if (highVerbindungen.length === 1) {
          const p = highVerbindungen[0];
          if (p) {
            const message = `✨ Smart-Verbindung Alert: ${p.name} passt zu über 90% zu dir!`;
            setNotification({ id: p.id, message });
            
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Smart-Verbindung gefunden!', { body: message, icon: '/favicon.ico' });
                }
              }
            } else {
          const message = `✨ Smart-Verbindung Alert: ${highVerbindungen.length} neue Profile passen zu über 90% zu dir!`;
          setNotification({ id: 'batch', message });
          
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Neue Smart-Verbindunges!', { body: message, icon: '/favicon.ico' });
              }
            }
        
        const timer = setTimeout(() => {
          setNotification(null);
            }, 5000);
        return () => clearTimeout(timer);
      }
    }
    
    if (availableProfiles[0]) {
      // Normal 80%+ check for the current profile
      const currentProfile = availableProfiles[0];
      const score = calculateMatchScore(userInterests, currentProfile.interests);
      
      // If smartMatchEnabledState is true, we already alerted for >= 90 above.
      // So here we only alert for 80-89 if smartMatchEnabledState is true, 
      // or for >= 80 if smartMatchEnabledState is false.
      const shouldNotifyNormal = smartMatchEnabledState ? (score >= 80 && score < 90) : (score >= 80);
      
      if (shouldNotifyNormal && !notifiedHighVerbindungen.has(currentProfile.id)) {
        const message = `🔥 Top Verbindung in der Nähe: ${currentProfile.name} teilt viele deiner Interessen! (${score}%)`;
        setNotification({
          id: currentProfile.id,
          message
            });
        setNotifiedHighVerbindungen(prev => new Set(prev).add(currentProfile.id));
        
        // Trigger push notification if smartMatch is false (since if it's true, we only push for >= 90)
        if (!smartMatchEnabledState && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Neues Top Verbindung!', {
            body: message,
            icon: '/favicon.ico'
              });
            }
        
        const timer = setTimeout(() => {
          setNotification(null);
            }, 4000);
        return () => clearTimeout(timer);
      } else if (notification && notification.id !== currentProfile.id && notification.id !== 'batch') {
        setNotification(null);
      }
    } else if (notification) {
      setNotification(null);
    }
  }, [availableProfiles, userInterests, notifiedHighVerbindungen, notification, smartMatchEnabledState]);

  useEffect(() => {
    const fetchSummary = async () => {
      const currentProfile = availableProfiles[0];
      if (!currentProfile) return;

      setIsLoadingSummary(true);
      setProfileSummary(null);

      try {
        const summary = await fetchProfileSummary(
          userInterests,
          currentProfile.name,
          currentProfile.interests,
          currentProfile.bio
        );
        setProfileSummary(summary);
      } catch (e) {
        console.warn("Failed to fetch summary:", e);
        setProfileSummary((e instanceof Error ? e.message : String(e)) || "Das KI-Limit wurde vorübergehend erreicht. Bitte warte kurz.");
      } finally {
        setIsLoadingSummary(false);
  
      }
    };

    fetchSummary();
  }, [availableProfiles[0]?.id, userInterests]);

  useEffect(() => {
    // Determine the currently viewed profile (either the one in the modal, or the top of the kontakt stack)
    const activeProfile = modalProfile || availableProfiles[0];
    
    if (activeProfile && calculateMatchScore(userInterests, activeProfile.interests) >= 90) {
      if (!celebratedProfiles.has(activeProfile.id)) {
        setCelebratedProfiles(prev => new Set(prev).add(activeProfile.id));
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000); // Hide after 3 seconds
      }
    }
  

  }, [modalProfile, availableProfiles, userInterests, celebratedProfiles]);

  
  useEffect(() => {
    const checkDeepVerbindungen = () => {
      let count = 0;
      availableProfiles.forEach(m => {
        if (calculateDeepMatch(userInterests, userInterests, m.values, m.personalityTraits, userNoGos, noGoStrictness).isDeepMatch) {
          count++;
            }
      });
      if (count > deepMatchCount && deepMatchCount !== 0) {
        setNewDeepMatchAlert(true);
        hapticFeedback([100, 50, 100, 50, 200]);
        setTimeout(() => setNewDeepMatchAlert(false), 5000);
        
        // Push notification logic
        const isPowerSaving = localStorage.getItem("klar_power_saving_until") && parseInt(localStorage.getItem("klar_power_saving_until") || "0") > Date.now();
        if (!isPowerSaving && "Notification" in window && Notification.permission === "granted") {
          new Notification("Neue Tiefe Verbindung!", {
            body: "Dein Profil-Update hat ein neues Deep-Verbindung generiert.",
            icon: "/icon.png"
              });
            }
        setDeepMatchCount(count);
      }
    };
    if (availableProfiles.length > 0) checkDeepVerbindungen();
  }, [availableProfiles, userInterests, userNoGos, noGoStrictness]);

  const fetchWeeklyReview = async () => {
    setIsFetchingReview(true);
    try {
      const savedJournals = localStorage.getItem("klar_dating_journals");
      const journals = savedJournals ? JSON.parse(savedJournals) : [];
      const res = await fetch("/api/weekly-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journals })
      });
      const data = await res.text().then(text => text ? JSON.parse(text) : {});
      setWeeklyReview(data.review);
    } catch(e) {
      melde("Dashboard", e);
      setWeeklyReview("Dein KI-Coach ist gerade offline. Versuch es später noch einmal.");
    } finally {
      setIsFetchingReview(false);
    }
  };

  const handleContact = (profile: Profile, interaction: "nachricht" | "pass") => {
    // Analytics
    trackEvent('profile_interaction', { profileId: profile.id, interaction });

    if (interaction === "nachricht") {
      if (contactsLeft <= 0) return;
      
      const newContactsLeft = contactsLeft - 1;
      setContactsLeft(newContactsLeft);
      localStorage.setItem('klar_contacts_left', newContactsLeft.toString());
      
      const newSeenIds = [...seenIds, profile.id];
      setSeenIds(newSeenIds);
      localStorage.setItem('klar_seen_ids', JSON.stringify(newSeenIds));

      // Notification with Undo
      setNotification({
        id: 'kontakt_' + profile.id,
        message: 'Kontaktanfrage gesendet',
        onUndo: () => {
          // Revert contacts
          setContactsLeft(contactsLeft);
          localStorage.setItem('klar_contacts_left', contactsLeft.toString());
          
          // Revert seen
          setSeenIds(seenIds);
          localStorage.setItem('klar_seen_ids', JSON.stringify(seenIds));
          
          setNotification(null);
          if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
            }
      });
      
      // Process after 5 seconds
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setNotification(null);
        recordInteraction(profile, interaction);
        
        // Update stats
        const matchesCount = parseInt(localStorage.getItem("stats_matches_collected") || "0", 10);
        localStorage.setItem("stats_matches_collected", (matchesCount + 1).toString());

        const today = new Date().toDateString();
        const savedDate = localStorage.getItem('klar_goal_date');
        let currentInteractions = parseInt(localStorage.getItem('klar_daily_interactions') || "0", 10);
        if (savedDate !== today) {
           currentInteractions = 0;
           localStorage.setItem('klar_goal_date', today);
            }
        localStorage.setItem('klar_daily_interactions', (currentInteractions + 1).toString());
        window.dispatchEvent(new Event('klar_interaction_updated'));
      }, 5000);
      
    } else {
      // Pass doesn't cost a Kontakt
      const newSeenIds = [...seenIds, profile.id];
      setSeenIds(newSeenIds);
      localStorage.setItem('klar_seen_ids', JSON.stringify(newSeenIds));
      recordInteraction(profile, interaction);
    }
  };

  const handleQuizComplete = (values: string[]) => {
    const newUserInterests = Array.from(new Set([...userInterests, ...values]));
    setUserInterests(newUserInterests);
    localStorage.setItem("userInterests", JSON.stringify(newUserInterests));
    
    setNotification({ id: Date.now().toString(), message: "Werte erfolgreich hinzugefügt! Verbindungen werden aktualisiert." });
    setTimeout(() => setNotification(null), 3000);
  };


  // Simulate an incoming message on Dashboard for haptic feedback demonstration
  useEffect(() => {
    const timer = setTimeout(() => {
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      setNotification({
        id: 'new_msg_' + Date.now(),
        message: '💬 Neue Nachricht von einem Verbindung!'
      });
      setTimeout(() => setNotification(null), 5000);
    }, 12000); // Trigger after 12 seconds
    return () => clearTimeout(timer);
  }, []);

  const handleGenerateIcebreaker = async (profile: Profile) => {
    setIsGeneratingIcebreaker(true);
    try {
      const prompt = `Erstelle einen kurzen, charmanten Icebreaker-Spruch (1-2 Sätze) für ${profile.name}. 
Ihre Interessen: ${profile.interests.join(", ")}. 
Meine Interessen: ${userInterests.join(", ")}. 
Finde eine Gemeinsamkeit oder stelle eine interessante Frage, um das Gespräch zu beginnen. Sei kreativ, nicht zu kitschig.`;
      const response = await askAICoach(prompt);
      setGeneratedIcebreaker(response.replace(/^"|"$/g, '').trim());
      
      // Update stats
      const currentCount = parseInt(localStorage.getItem('klar_icebreaker_count') || '0', 10);
      localStorage.setItem('klar_icebreaker_count', (currentCount + 1).toString());
      // Trigger storage event so dashboard updates
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn("Failed to generate icebreaker", e);
      setGeneratedIcebreaker("Hey, tolles Profil! Hast du Lust zu schreiben?");
    } finally {
      setIsGeneratingIcebreaker(false);
    }
  };

  if (contactsLeft <= 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-light-bg dark:bg-dark-bg">
        <div className="w-16 h-16 bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
          <Info className="text-stone-500 dark:text-stone-400" size={32} />
        </div>
        <h2 className="text-2xl font-serif mb-2 text-stone-900 dark:text-stone-100">Für heute geschafft.</h2>
        <p className="text-stone-600 dark:text-stone-400 mb-6">
          Du hast dein Limit für heute erreicht. Nimm dir Zeit für echte Gespräche mit deinen bisherigen Verbindungen.
        </p>
        <button 
          onClick={() => {
            setContactsLeft(DAILY_LIMIT);
            setSeenIds([]);
            localStorage.setItem('klar_contacts_left', DAILY_LIMIT.toString());
            localStorage.setItem('klar_seen_ids', JSON.stringify([]));
              }}
          className="px-6 py-3 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-xl font-medium shadow-md hover:opacity-90 transition-opacity"
        >
          Reset für Demo
        </button>
      </div>
    );
  }

  const profile = availableProfiles[0];
  
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-light-bg dark:bg-dark-bg">
        <div className="w-16 h-16 bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4">
          <Info className="text-stone-500 dark:text-stone-400" size={32} />
        </div>
        <h2 className="text-2xl font-serif mb-2 text-stone-900 dark:text-stone-100">Keine Profile mehr.</h2>
        <p className="text-stone-600 dark:text-stone-400 mb-6">
          Wir haben aktuell keine weiteren Profile für dich.{(filterLocation || filterSharedHobbies || filterSharedGoals || filterSharedCommunication || showHighVerbindungenOnly || highCompatibilityFirst || prioritizeInterests || matchIntensity > 0 || filterMaxDistance < 100 || filterMinAge > 18 || filterMaxAge < 99 || filterSpecificInterest !== "") ? " Versuche, deine Filter anzupassen." : ""}
        </p>
        <div className="flex flex-col gap-3">
          {(filterLocation || filterSharedHobbies || filterSharedGoals || filterSharedCommunication || showHighVerbindungenOnly || highCompatibilityFirst || prioritizeInterests || matchIntensity > 0 || filterMaxDistance < 100 || filterMinAge > 18 || filterMaxAge < 99 || filterSpecificInterest !== "") && (
            <button 
              onClick={() => {
                setShowHighVerbindungenOnly(false);
                setFilterLocation(null);
                setFilterSharedHobbies(false);
                setFilterSharedGoals(false);
                setFilterSharedCommunication(false);
                setHighCompatibilityFirst(false);
                setFilterMaxDistance(100);
                setFilterMinAge(18);
                setFilterMaxAge(99);
                setFilterSpecificInterest("");
                  }}
              className="px-6 py-3 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-xl font-medium"
            >
              Filter zurücksetzen
            </button>
          )}
                    <button 
            onClick={() => {
              setContactsLeft(DAILY_LIMIT);
              setSeenIds([]);
              localStorage.setItem('klar_contacts_left', DAILY_LIMIT.toString());
              localStorage.setItem('klar_seen_ids', JSON.stringify([]));
            }}
            className="px-6 py-3 bg-stone-200 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-xl font-medium shadow-md hover:opacity-90 transition-opacity"
          >
            Reset für Demo
          </button>
        </div>
      </div>
    );
  }

  const getBatteryIcon = () => {
    if (contactsLeft > 3) return <BatteryFull size={16} className="text-brand dark:text-brand-light" />;
    if (contactsLeft > 1) return <BatteryMedium size={16} className="text-amber-500" />;
    return <BatteryLow size={16} className="text-rose-500" />;
  };


  const verbindungenInterests = availableProfiles.flatMap(p => p.interests);
  const uniqueVerbindungenInterests = Array.from(new Set(verbindungenInterests)).slice(0, 10);
  
  return (
    <div className={`h-full flex flex-col p-4 relative transition-colors duration-1000 ${getBackgroundMilestoneClass()}`}>
      <AppTour />
      <DailyCoachAffirmation />
      <DashboardDateBanner />
      <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl mb-4 shrink-0 relative z-10">
        <button onClick={() => setActiveTab('discover')} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'discover' ? 'bg-white dark:bg-stone-700 shadow-sm text-brand dark:text-brand-light' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}>Entdecken</button>
        <button onClick={() => setActiveTab('inspiration')} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'inspiration' ? 'bg-white dark:bg-stone-700 shadow-sm text-brand dark:text-brand-light' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}>Inspiration</button>
      </div>

      <div className={`flex-1 flex-col overflow-hidden relative ${activeTab === 'discover' ? 'flex' : 'hidden'}`}>
        <AnimatePresence>
        {walkthroughStep > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 z-40 pointer-events-auto"
            onClick={nextWalkthroughStep}
          >
            {walkthroughStep === 1 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-stone-900 p-6 rounded-2xl max-w-sm w-11/12 text-center">
                <Sparkles size={32} className="text-brand dark:text-brand-light mx-auto mb-4" />
                <h3 className="text-xl font-serif text-stone-900 dark:text-stone-100 mb-2">Finde genau was du suchst</h3>
                <p className="text-stone-600 dark:text-stone-400 mb-6 text-sm">
                  Nutze die neuen Filter-Chips, um Profile nach deinen aktuellen Interessen zu filtern. Klicke auf ein Interesse, um nur dazu passende Verbindungen zu sehen.
                </p>
                <div className="flex gap-3">
                  <button onClick={skipWalkthrough} className="flex-1 py-3 text-stone-600 dark:text-stone-400 font-medium text-sm">Überspringen</button>
                  <button onClick={nextWalkthroughStep} className="flex-1 py-3 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-xl font-medium text-sm shadow-sm hover:opacity-90">Weiter</button>
                </div>
              </div>
            )}
            
            {walkthroughStep === 2 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-stone-900 p-6 rounded-2xl max-w-sm w-11/12 text-center">
                <Info size={32} className="text-brand dark:text-brand-light mx-auto mb-4" />
                <h3 className="text-xl font-serif text-stone-900 dark:text-stone-100 mb-2">Lerne deine Verbindung kennen</h3>
                <p className="text-stone-600 dark:text-stone-400 mb-6 text-sm">
                  Tippe einfach auf eine Profilkarte, um mehr über die Interessen, Hobbys und eine ausführliche Bio der Person zu erfahren.
                </p>
                <div className="flex gap-3">
                  <button onClick={nextWalkthroughStep} className="w-full py-3 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-xl font-medium text-sm shadow-sm hover:opacity-90">Verstanden</button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: -50, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            exit={{ y: -50, opacity: 0, x: "-50%" }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-28 left-1/2 z-[100] bg-brand dark:bg-brand-light text-white dark:text-stone-900 px-4 py-3 rounded-2xl shadow-md flex items-center justify-between gap-3 w-11/12 max-w-sm border border-white/20"
          >
            <span className="text-sm font-medium">{notification.message}</span>
            {notification.onUndo && (
              <button 
                onClick={notification.onUndo}
                className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors"
              >
                Rückgängig
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {activeTab === 'discover' && (
        <div className="absolute top-0 right-0 p-4 z-50 pointer-events-none w-full">
          <div className="flex justify-end gap-2 pointer-events-auto">
            <button 
              onClick={() => setShowFilterSheet(true)}
              className="p-2.5 bg-white dark:bg-stone-900 rounded-full shadow-sm text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors border border-stone-100 dark:border-stone-800"
              aria-label="Filter"
            >
              <Filter size={20} />
            </button>
          </div>
        </div>
      )}
      
      {/* P0-1: Die oeffnende <AnimatePresence> fehlte. Das schliessende Tag
          in Zeile 1139 hatte keine Entsprechung — daher der Fehler
          "Expected corresponding JSX closing tag for div". Der Wrapper ist
          noetig, weil der Block eine exit-Animation benutzt. */}
      <AnimatePresence>
      {showFilterSheet && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex justify-end">
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-4/5 max-w-sm h-full bg-white dark:bg-stone-900 shadow-xl overflow-y-auto"
          >
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md z-10">
              <h2 className="font-serif text-xl text-stone-900 dark:text-stone-100">Filter</h2>
              <button onClick={() => setShowFilterSheet(false)} className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white rounded-full bg-stone-100 dark:bg-stone-800">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-6 pb-24">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-stone-900 dark:text-stone-100">KI-Deep-Match</span>
                    <label className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                      <input 
                        type="checkbox" 
                        checked={aiFilterMode}
                        onChange={async (e) => {
                          const checked = e.target.checked;
                          setAiFilterMode(checked);
                          if (checked && !aiMatchScores) {
                            setIsCalculatingAiScores(true);
                            try {
                              const res = await fetch("/api/ai-match", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  userInterests,
                                  profiles: availableProfiles.map(p => ({ id: p.id, bio: p.bio, interests: p.interests }))
                                })
                              });
                              if (!res.ok) throw new Error("API request failed");
                              const data = await res.text().then(text => text ? JSON.parse(text) : {});
                              const scoresMap = data.reduce((acc: any, item: any) => {
                                acc[item.id] = { score: item.score, reason: item.reason };
                                return acc;
                              }, {});
                              setAiMatchScores(scoresMap);
                            } catch (err) {
                              console.warn("Failed to calculate AI verbindung scores", err);
                              setAiFilterMode(false);
                            } finally {
                              setIsCalculatingAiScores(false);
                            }
                          }
                        }}
                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-stone-200 dark:border-stone-700 checked:right-0 checked:border-brand dark:checked:border-brand-light transition-all"
                      />
                      <div className="toggle-label block overflow-hidden h-5 rounded-full bg-stone-200 dark:bg-stone-700"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Sortiert Profile nach echter psychologischer Passgenauigkeit (analysiert durch KI).
                  </p>
                  {isCalculatingAiScores && (
                    <div className="mt-2 text-xs text-brand font-medium animate-pulse flex items-center gap-1">
                      <div className="w-3 h-3 bg-brand/50 rounded-full animate-pulse" />
                      Analysiere Profile tiefgründig...
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-stone-500 dark:text-stone-400 mb-1.5 flex justify-between">
                    <span>Matching-Intensität</span>
                    <span className="font-medium text-brand dark:text-brand-light">
                      {matchIntensity === 0 ? "Offen für Neues" : matchIntensity < 50 ? "Etwas selektiver" : matchIntensity < 80 ? "Starke Verbindungen" : "Präzise Verbindungen"}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={matchIntensity}
                    onChange={(e) => setMatchIntensity(parseInt(e.target.value))}
                    className="w-full accent-brand dark:accent-brand-light"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span>Offen</span>
                    <span>Präzise</span>
                  </div>
                </div>

                {userCoords && (
                  <div>
                    <label className="text-xs text-stone-500 dark:text-stone-400 mb-1.5 flex justify-between">
                      <span>Maximale Distanz</span>
                      <span className="font-medium text-brand dark:text-brand-light">{filterMaxDistance < 100 ? `${filterMaxDistance} km` : 'Egal'}</span>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={filterMaxDistance}
                      onChange={(e) => setFilterMaxDistance(parseInt(e.target.value))}
                      className="w-full accent-brand dark:accent-brand-light"
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-xs text-stone-500 dark:text-stone-400 mb-1.5 flex justify-between">
                    <span>Alter</span>
                    <span className="font-medium text-brand dark:text-brand-light">{filterMinAge} - {filterMaxAge === 99 ? '99+' : filterMaxAge} Jahre</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="18"
                      max="99"
                      value={filterMinAge}
                      onChange={(e) => setFilterMinAge(Math.min(parseInt(e.target.value) || 18, filterMaxAge))}
                      className="w-full bg-stone-100 dark:bg-stone-800 border border-transparent rounded-xl px-3 py-2 text-sm text-center text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand/50"
                    />
                    <span className="text-stone-400">-</span>
                    <input
                      type="number"
                      min="18"
                      max="99"
                      value={filterMaxAge}
                      onChange={(e) => setFilterMaxAge(Math.max(parseInt(e.target.value) || 99, filterMinAge))}
                      className="w-full bg-stone-100 dark:bg-stone-800 border border-transparent rounded-xl px-3 py-2 text-sm text-center text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-500 dark:text-stone-400 mb-1.5 block">Interesse suchen</label>
                  <input
                    type="text"
                    placeholder="z.B. Yoga, Klettern..."
                    value={filterSpecificInterest}
                    onChange={(e) => setFilterSpecificInterest(e.target.value)}
                    onBlur={() => saveSearchHistory(filterSpecificInterest)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveSearchHistory(filterSpecificInterest);
                      }
                    }}
                    className="w-full bg-stone-100 dark:bg-stone-800 border border-transparent rounded-xl px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand/50"
                  />
                  {searchHistory.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {searchHistory.map((search, i) => (
                        <button
                          key={i}
                          onClick={() => setFilterSpecificInterest(search)}
                          className="px-2 py-1 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-[10px] font-medium"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs text-stone-500 dark:text-stone-400 mb-1.5 block">Standort</label>
                  <div className="relative">
                    <select 
                      value={filterLocation || ""} 
                      onChange={(e) => setFilterLocation(e.target.value || null)}
                      className="w-full bg-stone-100 dark:bg-stone-800 border border-transparent rounded-xl px-4 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brand/50 appearance-none"
                    >
                      <option value="">Alle Standorte</option>
                      {uniqueLocations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={`mb-4 transition-all ${walkthroughStep === 1 ? 'relative z-50 ring-4 ring-brand/50 bg-white dark:bg-stone-900 rounded-xl p-2 -mx-2' : ''}`}>
        <SmartMatchFilter
          filterSharedHobbies={filterSharedHobbies}
          onFilterSharedHobbiesChange={setFilterSharedHobbies}
          filterSharedGoals={filterSharedGoals}
          onFilterSharedGoalsChange={setFilterSharedGoals}
          filterSharedCommunication={filterSharedCommunication}
          onFilterSharedCommunicationChange={setFilterSharedCommunication}
        />
      </div>

      {/* P0-1: Der onDragEnd-Block war unvollstaendig — drei schliessende
          Klammern fehlten, die Datei war nicht parsebar. */}
      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={(e, { offset, velocity }) => {
          if (offset.x < -80 || velocity.x < -500) {
            handleContact(profile, "pass");
          } else if (offset.x > 80 || velocity.x > 500) {
            handleContact(profile, "nachricht");
          }
        }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0.95, opacity: 0, x: -100 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        key={profile.id}
        className={`flex-1 flex flex-col bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border cursor-pointer transition-colors ${
          walkthroughStep === 2 
            ? 'relative z-50 scale-[1.02] shadow-md ring-4 ring-brand/50 border-stone-300 dark:border-stone-700' 
            : (aiFilterMode && aiMatchScores && aiMatchScores[profile.id] ? aiMatchScores![profile.id]!.score : calculateMatchScore(userInterests, profile.interests)) >= 90
              ? 'border-yellow-400/50 dark:border-yellow-500/50 shadow-[0_0_25px_-5px_rgba(250,204,21,0.4)] dark:shadow-[0_0_25px_-5px_rgba(234,179,8,0.2)] '
              : 'border-stone-300 dark:border-stone-700 '
        }`}
        onClick={() => {
          setModalProfile(profile);
          setGeneratedIcebreaker(null);
          if (walkthroughStep === 2) {
            nextWalkthroughStep();
          }
        }}
      >
        <div className="h-[45%] bg-stone-200 dark:bg-stone-800 relative">
          <img src={profile.photoUrl} alt={`Foto von ${profile.name}`} className="w-full h-full object-cover" loading="lazy" />
          {(aiFilterMode && aiMatchScores && aiMatchScores[profile.id] ? aiMatchScores![profile.id]!.score : calculateMatchScore(userInterests, profile.interests)) >= 90 && (
            <div className="absolute top-4 left-4 z-10" onClick={(e) => { e.stopPropagation(); setSmartMatchDetailProfile(profile); }}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, filter: "brightness(0.5)" }}
                whileInView={{ 
                  opacity: 1, 
                  scale: 1, 
                  filter: "brightness(1)",
                  boxShadow: [
                    "0 0 0px rgba(250,204,21,0)", 
                    "0 0 30px rgba(250,204,21,0.8)", 
                    "0 0 15px rgba(250,204,21,0.4)"
                  ] 
                }}
                viewport={{ once: true, margin: "-10px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className=" from-yellow-50 to-amber-50 dark:from-stone-900 dark:to-stone-900/95  border border-yellow-300 dark:border-yellow-600/50 text-yellow-600 dark:text-yellow-500 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer  transition-transform"
              >
                <Sparkles size={14} className="fill-current" />
                Smart-Verbindung
              </motion.div>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col justify-between flex-1 relative overflow-y-auto hide-scrollbar">
          <div className="absolute -top-6 right-6 flex flex-col items-end gap-2">
            {calculateDeepMatch(userInterests, userInterests, profile.values, profile.personalityTraits, userNoGos, noGoStrictness).isDeepMatch && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full border border-purple-200 dark:border-purple-800/50 shadow-sm shadow-purple-500/10">
                <Sparkles size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Tiefe Verbindung</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white dark:bg-stone-900 rounded-full border border-stone-200 dark:border-stone-700 shadow-md p-1.5 pr-3">
              <VerbindungScoreBadge score={(aiFilterMode && aiMatchScores && aiMatchScores[profile.id] ? aiMatchScores![profile.id]!.score : calculateMatchScore(userInterests, profile.interests))} />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 leading-none">KI-basiert</span>
                <span className="text-xs font-semibold text-brand dark:text-brand-light leading-none mt-0.5">KI-Verbindung</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-serif font-medium text-stone-900 dark:text-stone-100">{profile.name}, {profile.age}</h2>
              <ShieldCheck size={20} className="text-blue-500" />
            </div>
            {profile.location && (
              <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm mb-3">
                <MapPin size={14} />
                <span>
                  {profile.location}
                  {(() => {
                    const coords = cityCoordinates[profile.location];
                    if (userCoords && coords) {
                      return (
                        <span className="ml-2 px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded-md text-xs font-medium">
                          {calculateDistance(userCoords.lat, userCoords.lng, coords.lat, coords.lng)} km entfernt
                        </span>
                      );
                    }
                    return null;
                  })()}
                </span>
              </div>
            )}
            <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 mb-3">{profile.bio}</p>
            
            {(profileSummary || isLoadingSummary || (aiFilterMode && aiMatchScores && aiMatchScores[profile.id])) && (
              <div className="mb-4 bg-brand/5 dark:bg-brand-light/5 border border-brand/20 dark:border-brand-light/20 rounded-xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={14} className="text-brand dark:text-brand-light shrink-0" />
                  <h4 className="font-semibold text-xs text-brand dark:text-brand-light uppercase tracking-wider">Verbindungs-Tipp</h4>
                </div>
                <div className="text-sm text-stone-700 dark:text-stone-300">
                  {isLoadingSummary ? (
                    <span className="animate-pulse">KI generiert individuellen Verbindungs-Tipp...</span>
                  ) : (
                    (aiFilterMode && aiMatchScores && aiMatchScores[profile.id] ? aiMatchScores![profile.id]!.reason : profileSummary)
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map(interest => {
              const isMustHave = mustHaveInterests.includes(interest);
              const shared = isMustHave || isInterestShared(interest, userInterests);
              return (
                <span key={interest} className={`px-3 py-1 rounded-full text-xs font-medium border ${
                  isMustHave
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                    : shared 
                      ? 'bg-brand/10 dark:bg-brand-light/10 border-brand/30 dark:border-brand-light/30 text-brand dark:text-brand-light' 
                      : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                }`}>
                  {isMustHave && <Star size={12} className="inline mr-1 -mt-0.5 fill-current" />}
                  {!isMustHave && shared && <Sparkles size={12} className="inline mr-1 -mt-0.5" />}
                  {interest}
                </span>
              );
            })}
          </div>
          
          <MatchCompatibilityInsights 
            userInterests={userInterests} 
            profileInterests={profile.interests} 
            profileName={profile.name} 
          />
        </div>
      </motion.div>
      
      <div className="pt-6 pb-2 flex items-center justify-center gap-4">
        <button 
          onClick={() => handleContact(profile, "pass")}
          className="flex-1 py-4 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <X size={20} />
          <span className="font-medium text-sm uppercase tracking-wider">Weiter</span>
        </button>
        <button 
          onClick={() => handleContact(profile, "nachricht")}
          className="flex-1 py-4 bg-brand dark:bg-brand-light hover:opacity-90 text-white dark:text-stone-900 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <Heart size={20} className="fill-current" />
          <span className="font-medium text-sm uppercase tracking-wider">Icebreaker</span>
        </button>
      </div>
      <MoodDiaryReminder />
      <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 mb-2 -mx-4 px-4 pb-6 pt-2">
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <WeeklyMilestoneRevealWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DailyVibeCheckWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingVibeAnalyzerWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DailyPromptWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <WeeklySuccessSummaryWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <ValuesQuizWidget onComplete={handleQuizComplete} />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <CompatibilityRadarWidget userInterests={userInterests} verbindungen={availableProfiles} />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DailyMoodCheckInWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <MoodMonitorWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <ProfileCheckWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <QuickPreparationCountdownWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatePlannerWidget userInterests={userInterests} location={filterLocation} />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <CityInsiderWidget location={filterLocation} />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <SmartDatingDiaryWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DateDiaryStatsWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <ClarityScoreWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DateSuccessRadarWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingTimelineWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <WeeklyConsistencyWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DailyGoalRingsWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DateMoodStreakWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingReadinessWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DailyCoachInsightWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DateMoodChartWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <NextDateWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <CityTrendRadarWidget location={filterLocation} />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <SmartVibeMapWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatePreparationChecklistWidget userInterests={userInterests} />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DateReflectionJournalWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <PastDatesArchiveWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DateMemoriesWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingHappinessScoreWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <VerbindungContextAnalysisWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingFocusModeWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <BreathingExerciseWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <SituationalIcebreakerWidget userInterests={userInterests} />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <MatchIcebreakersWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <YearInReviewWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DateRatingChartWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DateSuccessTrendWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingHealthWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingRitualWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <MatchCompassWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <SmartVerbindungBadgeWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingMilestonesWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <SmartDateReminderWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DataExportWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingSuccessScoreWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DailyAffirmationWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingGoalProgressWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <PrePostDateVibeWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <MonthlyMoodAreaWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DateTypePieChartWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          {!isFocusMode && <ReflectionInsightDashboard />}
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <MoodInsightWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <MiniCalendarWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingGoalRoadmapWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingSuccessArchiveWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
            <DatingProgressChartWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingKarmaWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <MoodDiaryWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <PopularDateIdeasWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          {!isFocusMode && <WeeklyTimelineWidget />}
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <SuccessDashboardWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <ConversationStatsWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <UpcomingDateWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          {!isFocusMode && <DailyPulseWidget />}
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DailyGoalTracker />
        </div>

        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <SocialEnergyWidget />
        </div>

        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <WeeklyConsistencyTracker />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <DatingWheelStatsWidget />
        </div>
        <div className="min-w-[85%] max-w-md snap-center shrink-0 empty:hidden">
          <TrendingInterestsWidget location={filterLocation} />
        </div>
      </div>

      <SmartVerbindungCarousel 
        profiles={availableProfiles} 
        userInterests={userInterests} 
        onProfileClick={(profile) => {
          setModalProfile(profile);
          setGeneratedIcebreaker(null);
        }}
      />

                  <KlarMatchWidget 
        onProfileClick={(profile) => {
          setModalProfile(profile);
          setGeneratedIcebreaker(null);
        }}
      />
      <TodayFeelingTrackerWidget />
      <MiniDiaryWidget />
      <DatingWheelWidget />
      <SuccessSummaryWidget />
      <WheelStatsWidget />
      <DatingDuelWidget />
      <DatingMilestones />
      <DailyMoodWidget />
      <RecentIntrosWidget />


      <AnimatePresence>
        {modalProfile && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-40"
              onClick={() => setModalProfile(null)}
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`absolute inset-x-0 bottom-0 top-16 bg-white dark:bg-stone-900 z-50 rounded-t-3xl flex flex-col overflow-hidden shadow-md border-t-2 ${
                (aiFilterMode && aiMatchScores && aiMatchScores[modalProfile.id] ? aiMatchScores![modalProfile.id]!.score : calculateMatchScore(userInterests, modalProfile.interests)) >= 90
                  ? 'border-yellow-400/50 dark:border-yellow-500/50 shadow-[0_-10px_40px_-10px_rgba(250,204,21,0.3)] dark:shadow-[0_-10px_40px_-10px_rgba(234,179,8,0.2)]'
                  : 'border-transparent'
          }`}
            >
              <div className="relative h-2/5 shrink-0 bg-stone-200 dark:bg-stone-800">
                <img src={modalProfile.photoUrl} alt={`Foto von ${modalProfile.name}`} className="w-full h-full object-cover" />
                {(aiFilterMode && aiMatchScores && aiMatchScores[modalProfile.id] ? aiMatchScores![modalProfile.id]!.score : calculateMatchScore(userInterests, modalProfile.interests)) >= 90 && (
                  <div className="absolute top-4 left-4 z-10" onClick={(e) => { e.stopPropagation(); setSmartMatchDetailProfile(modalProfile); }}>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8, filter: "brightness(0.5)" }}
                      whileInView={{ 
                        opacity: 1, 
                        scale: 1, 
                        filter: "brightness(1)",
                        boxShadow: [
                          "0 0 0px rgba(250,204,21,0)", 
                          "0 0 30px rgba(250,204,21,0.8)", 
                          "0 0 15px rgba(250,204,21,0.4)"
                        ] 
                      }}
                      viewport={{ once: true, margin: "-10px" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className=" from-yellow-50 to-amber-50 dark:from-stone-900 dark:to-stone-900/95  border border-yellow-300 dark:border-yellow-600/50 text-yellow-600 dark:text-yellow-500 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer  transition-transform"
                    >
                      <Sparkles size={14} className="fill-current" />
                      Smart-Verbindung
                    </motion.div>
                  </div>
                )}
                <button 
                  onClick={() => setModalProfile(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40  rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-serif font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      {modalProfile.name}, {modalProfile.age}
                      <ShieldCheck size={24} className="text-blue-500" />
                    </h2>
                    {modalProfile.location && (
                      <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 mt-2">
                        <MapPin size={16} />
                        <span>
                          {modalProfile.location}
                          {(() => {
                            const coords = cityCoordinates[modalProfile.location];
                            if (userCoords && coords) {
                              return (
                                <span className="ml-2 px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded-md text-xs font-medium">
                                  {calculateDistance(userCoords.lat, userCoords.lng, coords.lat, coords.lng)} km entfernt
                                </span>
                              );
                          }
                            return null;
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 bg-stone-50 dark:bg-stone-800/50 rounded-full border border-stone-200 dark:border-stone-700 shadow-sm p-1.5 pr-3">
                    <VerbindungScoreBadge score={(aiFilterMode && aiMatchScores && aiMatchScores[modalProfile.id] ? aiMatchScores![modalProfile.id]!.score : calculateMatchScore(userInterests, modalProfile.interests))} />
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 leading-none">KI-basiert</span>
                      <span className="text-xs font-semibold text-brand dark:text-brand-light leading-none mt-0.5">KI-Verbindung</span>
                    </div>
                  </div>
                  {calculateDeepMatch(userInterests, userInterests, modalProfile.values, modalProfile.personalityTraits, userNoGos, noGoStrictness).isDeepMatch && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full border border-purple-200 dark:border-purple-800/50">
                        <Sparkles size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">Tiefe Verbindung</span>
                      </div>
                    )}
                </div>

                {(profileSummary || isLoadingSummary || (aiFilterMode && aiMatchScores && aiMatchScores[modalProfile.id])) && (
                  <div className="bg-brand/5 dark:bg-brand-light/5 border border-brand/20 dark:border-brand-light/20 rounded-xl p-4 mb-8 flex gap-3 items-start">
                    <div className="bg-brand/10 dark:bg-brand-light/10 p-2 rounded-lg shrink-0">
                      <Sparkles size={20} className="text-brand dark:text-brand-light" />
                    </div>
                    <div>
                      <h4 className="font-medium text-stone-900 dark:text-stone-100 text-sm mb-1">Individueller Verbindungs-Tipp</h4>
                      <div className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed">
                        {isLoadingSummary ? (
                          <span className="animate-pulse">KI analysiert euer Verbindung...</span>
                        ) : (
                          (aiFilterMode && aiMatchScores && aiMatchScores[modalProfile.id] ? aiMatchScores![modalProfile.id]!.reason : profileSummary)
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-3 border-b border-stone-200 dark:border-stone-800 pb-2">Über mich</h3>
                  <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-lg">{modalProfile.bio}</p>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-3 border-b border-stone-200 dark:border-stone-800 pb-2">Interessen</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {modalProfile.interests.map(interest => {
                      const isMustHave = mustHaveInterests.includes(interest);
                      const shared = isMustHave || isInterestShared(interest, userInterests);
                      return (
                        <span key={interest} className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                          isMustHave
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                            : shared 
                              ? 'bg-brand/10 dark:bg-brand-light/10 border-brand/30 dark:border-brand-light/30 text-brand dark:text-brand-light' 
                              : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                        }`}>
                          {isMustHave && <Star size={14} className="inline mr-1.5 -mt-0.5 fill-current" />}
                          {!isMustHave && shared && <Sparkles size={14} className="inline mr-1.5 -mt-0.5" />}
                          {interest}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <MatchCompatibilityInsights 
                  userInterests={userInterests} 
                  profileInterests={modalProfile.interests} 
                  profileName={modalProfile.name} 
                />

                <VerbindungOptimizerWidget 
                  userInterests={userInterests} 
                  profile={modalProfile} 
                />

                <div className="mt-8 mb-4">
                  <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-3 border-b border-stone-200 dark:border-stone-800 pb-2 flex items-center gap-2">
                    <Sparkles size={18} className="text-brand dark:text-brand-light" />
                    KI-Icebreaker
                  </h3>
                  {generatedIcebreaker ? (
                    <div className="bg-brand/10 dark:bg-brand-light/10 border border-brand/20 dark:border-brand-light/20 rounded-xl p-4 relative">
                      <Sparkles size={20} className="text-brand dark:text-brand-light absolute top-4 right-4 opacity-50" />
                      <p className="text-stone-800 dark:text-stone-200 font-medium italic pr-8 leading-relaxed">"{generatedIcebreaker}"</p>
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => {
                          setModalProfile(null);
                          handleContact(modalProfile, "nachricht");
                        }} className="flex-1 py-2.5 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                          <Heart size={16} className="fill-current" />
                          Senden
                        </button>
                        <button onClick={() => handleGenerateIcebreaker(modalProfile)} className="px-4 py-2.5 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors">Neu generieren</button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleGenerateIcebreaker(modalProfile)}
                      disabled={isGeneratingIcebreaker}
                      className="w-full py-4 bg-brand dark:bg-brand-light text-white dark:text-stone-900 rounded-xl shadow-sm flex flex-col items-center justify-center gap-2 transition-opacity group hover:opacity-90 disabled:opacity-70 disabled:pointer-events-none"
                    >
                      {isGeneratingIcebreaker ? (
                        <div className="w-6 h-6 bg-white/50 dark:bg-stone-900/50 rounded-full animate-pulse" />
                      ) : (
                        <Sparkles size={24} className="group- transition-transform" />
                      )}
                      <span className="font-semibold text-sm">
                        {isGeneratingIcebreaker ? "Analysiere eure Interessen..." : "Personalisierten Icebreaker generieren"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex gap-4">
                <button 
                  onClick={() => {
                    setModalProfile(null);
                    handleContact(modalProfile, "pass");
                  }}
                  className="flex-1 py-4 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <X size={20} />
                  <span className="font-medium text-sm uppercase tracking-wider">Weiter</span>
                </button>
                <button 
                  onClick={() => {
                    setModalProfile(null);
                    handleContact(modalProfile, "nachricht");
                  }}
                  className="flex-1 py-4 bg-brand dark:bg-brand-light hover:opacity-90 text-white dark:text-stone-900 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Heart size={20} className="fill-current" />
                  <span className="font-medium text-sm uppercase tracking-wider">Icebreaker</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {smartMatchDetailProfile && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
              onClick={() => setSmartMatchDetailProfile(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed z-[70] bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-md max-w-sm w-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-stone-200 dark:border-stone-700"
            >
              <div className=" from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 p-5 relative overflow-hidden">
                <button 
                  onClick={() => setSmartMatchDetailProfile(null)}
                  className="absolute top-4 right-4 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white dark:bg-stone-800/80 p-2 rounded-full shadow-sm text-yellow-500">
                    <Sparkles size={20} className="fill-current" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">Smart-Verbindung!</h3>
                </div>
                <p className="text-sm text-stone-700 dark:text-stone-300">
                  Warum passt <span className="font-semibold">{smartMatchDetailProfile.name}</span> so gut zu dir?
                </p>
              </div>
              
              <div className="p-5">
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Passgenauigkeit</h4>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {calculateMatchScore(userInterests, smartMatchDetailProfile.interests)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${calculateMatchScore(userInterests, smartMatchDetailProfile.interests)}%` }}
                      transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Gemeinsame Interessen</h4>
                  <div className="flex flex-wrap gap-2">
                    {smartMatchDetailProfile.interests.filter(i => isInterestShared(i, userInterests)).map(interest => {
                      const isMustHave = mustHaveInterests.includes(interest);
                      return (
                        <div key={interest} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${
                          isMustHave 
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50 text-yellow-700 dark:text-yellow-400' 
                            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {isMustHave ? <Star size={12} className="fill-current" /> : <Heart size={12} className="fill-current" />}
                          {interest}
                          {isMustHave && <span className="text-[10px] opacity-70 ml-1">(Must-have)</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mt-6">
                   <button
                    onClick={() => setSmartMatchDetailProfile(null)}
                    className="w-full py-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl font-medium text-sm transition-colors"
                   >
                     Schließen
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {showConfetti && <Confetti count={100} />}
      <SmartVerbindungTutorialOverlay />

      <div className="fixed bottom-24 right-4 z-40">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            hapticFeedback(HAPTIC_PATTERNS.LIGHT_TAP);
            if (activeTab === 'discover') {
              if (availableProfiles[0]) {
                setModalProfile(availableProfiles[0]);
              }
            }
          }}
          className="bg-brand dark:bg-brand-light text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          {activeTab === 'discover' ? <Heart size={24} className="fill-current" /> : <Sparkles size={24} />}
        </motion.button>
      </div>

      </div>

      <QuickThemeToggle />
      <div className={`flex-1 overflow-y-auto hide-scrollbar pb-24 ${activeTab === 'inspiration' ? 'block' : 'hidden'}`}>
        <div className="flex flex-col gap-4">
          <SmartVorschlaegeWidget />
          <WeeklyMoodSummaryWidget />
          <SafeDatePlannerWidget />
          <NextDateCountdownWidget />
          <PreDateChecklistWidget />
          <ReflectionLogWidget />
          <KlarCompassWidget userInterests={userInterests} />
          <WeeklyVibesWidget />
          <EmailSummaryWidget />
          <DatingJournalWidget userInterests={userInterests} />
          <QualityConversationsChartWidget />
          <DailyIcebreakerWidget userInterests={userInterests} verbindungenInterests={uniqueVerbindungenInterests} />
          <SmartDatePlannerWidget location={filterLocation} />
          <DateInspirationTab userInterests={userInterests} userCoords={userCoords} />
        </div>
      </div>
    </div>
  );
}