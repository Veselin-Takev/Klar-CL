import type { Profile } from "../data";
import { interestMapping } from "./matchScore";
import { melde } from "../lib/fehler";

export type Interaction = "nachricht" | "pass";

export function recordInteraction(profile: Profile, interaction: Interaction) {
  try {
    const key = `klar_interactions_${interaction}`;
    const existing = localStorage.getItem(key);
    const interests = existing ? JSON.parse(existing) : [];
    
    // Add all interests from the profile to the interaction history
    interests.push(...profile.interests);
    localStorage.setItem(key, JSON.stringify(interests));
  } catch (e) {
    melde("recommendationEngine", e);
  }
}

export function getLearnedInterestWeights(baseInterests: string[]): Record<string, number> {
  const weights: Record<string, number> = {};
  
  // Initialize with base interests
  baseInterests.forEach(interest => {
    const category = interestMapping[interest] || interest;
    weights[category] = 10; // High base weight
  });

  try {
    const nachricht = JSON.parse(localStorage.getItem('klar_interactions_like') || '[]');
    const passes = JSON.parse(localStorage.getItem('klar_interactions_pass') || '[]');

    nachricht.forEach((interest: string) => {
      const category = interestMapping[interest] || interest;
      weights[category] = (weights[category] || 0) + 2;
    });

    passes.forEach((interest: string) => {
      const category = interestMapping[interest] || interest;
      weights[category] = (weights[category] || 0) - 1;
    });
  } catch (e) {
    melde("recommendationEngine", e);
  }

  return weights;
}

export function calculateDynamicScore(profile: Profile, baseInterests: string[], mustHaveInterests: string[] = []): number {
  const weights = getLearnedInterestWeights(baseInterests);
  
  let score = 50; // Base score

  profile.interests.forEach(interest => {
    const category = interestMapping[interest] || interest;
    let weight = weights[category] || 0;
    
    if (mustHaveInterests.includes(interest)) {
      weight += 100; // High bonus for must-haves
    }
    
    score += weight;
  });

  // Normalize somewhat, but allow score to go over 100 to bump sorting rank
  return Math.max(10, score);
}

export function sortProfilesByRecommendation(profiles: Profile[], baseInterests: string[], mustHaveInterests: string[] = []): Profile[] {
  return [...profiles].sort((a, b) => {
    const scoreA = calculateDynamicScore(a, baseInterests, mustHaveInterests);
    const scoreB = calculateDynamicScore(b, baseInterests, mustHaveInterests);
    return scoreB - scoreA;
  });
}
