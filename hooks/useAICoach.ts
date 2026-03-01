import { useCallback, useMemo, useState, useEffect } from 'react';
import { useAICoachStore } from '@/stores/ai-coach-store';
import { useHistoryStore } from '@/stores/history-store';
import { useReadinessStore } from '@/stores/readiness-store';
import { useSettingsStore } from '@/stores/settings-store';

export interface CoachInsight {
  id: string;
  type: 'volume' | 'recovery' | 'technique' | 'plateau' | 'warning';
  title: string;
  description: string;
  confidence: number; // 0-100
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface CoachReport {
  weekStart: Date;
  weekEnd: Date;
  
  // Summary metrics
  workoutsCompleted: number;
  totalSets: number;
  totalVolume: number;
  avgRPE: number;
  
  // Readiness
  avgReadinessScore: number;
  readinessTrend: 'up' | 'down' | 'stable';
  
  // Volume vs targets
  volumeVsTarget: Record<string, { current: number; target: number; status: 'over' | 'under' | 'on-track' }>;
  
  // Insights
  insights: CoachInsight[];
  
  // Recommendations
  recommendations: string[];
}

/**
 * Hook for AI Coach functionality
 * Provides insights, recommendations, and weekly reports
 */
export function useAICoach() {
  const aiCoachStore = useAICoachStore();
  const historyStore = useHistoryStore();
  const readinessStore = useReadinessStore();
  const settingsStore = useSettingsStore();

  // Current coach state
  const profile = aiCoachStore.profile;
  const learningPhase = aiCoachStore.learningPhase;
  const insights = aiCoachStore.insights;
  const isAnalyzing = aiCoachStore.isAnalyzing;

  // Current readiness score
  const readinessScore = readinessStore.currentScore;

  // Get volume targets from settings
  const volumeTargets = settingsStore.settings.volumeTargets;

  // Run analysis
  const runAnalysis = useCallback(async () => {
    await aiCoachStore.analyzeWorkouts(historyStore.workouts);
    await aiCoachStore.generateInsights();
  }, [aiCoachStore, historyStore.workouts]);

  // Get personalized recommendation
  const getRecommendation = useCallback(
    (context: 'pre-workout' | 'post-workout' | 'weekly'): string => {
      // Base recommendations on current state
      if (readinessScore && readinessScore < 40) {
        return 'Your readiness is low. Consider taking a rest day or doing light activity.';
      }

      if (readinessScore && readinessScore > 80) {
        return 'You\'re feeling great! This is a good day for high-intensity training.';
      }

      // Check volume
      const recentWorkouts = historyStore.workouts.slice(0, 7);
      const totalSets = recentWorkouts.reduce((sum, w) => sum + w.totalSets, 0);

      if (totalSets > 30) {
        return 'You\'ve trained a lot this week. Consider keeping today\'s session moderate.';
      }

      return 'You\'re recovered and ready. Proceed with your planned workout.';
    },
    [readinessScore, historyStore.workouts]
  );

  // Get weekly report
  const getWeeklyReport = useCallback((): CoachReport => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get this week's workouts
    const weekWorkouts = historyStore.workouts.filter((w) => {
      const date = new Date(w.date);
      return date >= weekStart && date <= weekEnd;
    });

    // Calculate metrics
    const workoutsCompleted = weekWorkouts.length;
    const totalSets = weekWorkouts.reduce((sum, w) => sum + w.totalSets, 0);
    const totalVolume = weekWorkouts.reduce((sum, w) => sum + w.totalVolume, 0);

    // Calculate avg RPE (would need RPE in workout data)
    const avgRPE = 7.5; // Placeholder

    // Calculate readiness
    const readinessSurveys = readinessStore.surveys.slice(0, 7);
    const avgReadinessScore = readinessSurveys.length > 0
      ? readinessSurveys.reduce((sum, s) => sum + s.score, 0) / readinessSurveys.length
      : 0;

    // Volume vs targets
    const volumeVsTarget: Record<string, any> = {};
    if (volumeTargets) {
      for (const [muscle, target] of Object.entries(volumeTargets)) {
        // Calculate current volume for muscle (simplified)
        const current = 10; // Would need exercise->muscle mapping
        volumeVsTarget[muscle] = {
          current,
          target,
          status: current > target ? 'over' : current >= target * 0.8 ? 'on-track' : 'under',
        };
      }
    }

    // Generate insights
    const generatedInsights: CoachInsight[] = [];

    // Check for plateau
    if (aiCoachStore.detectedPlateau) {
      generatedInsights.push({
        id: 'plateau-warning',
        type: 'plateau',
        title: 'Plateau Detected',
        description: 'Your strength hasn\'t increased in 3+ weeks. Consider a deload.',
        confidence: 85,
        action: 'Try a deload week',
        priority: 'high',
      });
    }

    // Check for overtraining
    if (avgReadinessScore < 50 && workoutsCompleted > 4) {
      generatedInsights.push({
        id: 'overtraining',
        type: 'recovery',
        title: 'Recovery Needed',
        description: 'High training volume with low readiness. Risk of overtraining.',
        confidence: 75,
        action: 'Take a rest day',
        priority: 'high',
      });
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (workoutsCompleted < 3) {
      recommendations.push('Try to complete at least 3 workouts this week');
    }

    if (avgReadinessScore > 70) {
      recommendations.push('Great readiness! Push hard in your next session');
    }

    if (totalSets > 40) {
      recommendations.push('High volume week. Consider active recovery');
    }

    return {
      weekStart,
      weekEnd,
      workoutsCompleted,
      totalSets,
      totalVolume,
      avgRPE,
      avgReadinessScore,
      readinessTrend: 'stable', // Would need historical comparison
      volumeVsTarget,
      insights: generatedInsights,
      recommendations,
    };
  }, [historyStore.workouts, readinessStore.surveys, volumeTargets, aiCoachStore.detectedPlateau]);

  // Clear insights
  const clearInsights = useCallback(() => {
    aiCoachStore.clearInsights();
  }, [aiCoachStore]);

  // Dismiss an insight
  const dismissInsight = useCallback(
    (insightId: string) => {
      aiCoachStore.dismissInsight(insightId);
    },
    [aiCoachStore]
  );

  return {
    // State
    profile,
    learningPhase,
    insights,
    isAnalyzing,
    readinessScore,

    // Actions
    runAnalysis,
    getRecommendation,
    getWeeklyReport,
    clearInsights,
    dismissInsight,

    // Helpers
    isReady: readinessScore !== null && readinessScore > 0,
    needsAnalysis: insights.length === 0 && historyStore.workouts.length > 0,
  };
}
