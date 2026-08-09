import type { Profile } from '../data';
import { calculateMatchScore } from './matchScore';

export function saveSmartMatchSettings(enabled: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('klar_smart_match_alerts', String(enabled));
    window.dispatchEvent(new Event('smartMatchSettingsChanged'));
    
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
}

export function isSmartMatchEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('klar_smart_match_alerts') !== 'false'; // default to true
}

export function checkNewProfilesForSmartMatches(
  profiles: Profile[], 
  userInterests: string[], 
  notifiedIds: Set<string>
): Profile[] {
  if (!isSmartMatchEnabled()) {
    return [];
  }
  
  return profiles.filter(p => {
    if (notifiedIds.has(p.id)) return false;
    const score = calculateMatchScore(userInterests, p.interests);
    return score >= 90;
  });
}
