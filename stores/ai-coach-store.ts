import { create } from 'zustand';
import type { WorkoutSummaryData } from './workout-store';
import type { ReadinessEntry } from './readiness-store';
import {
  computeSFR,
  determineExerciseStatus,
  type ExerciseFeedback,
  type SFRScore,
  type ExerciseStatus,
} from '@/lib/ai/sfr-scoring';
import { EXERCISE_LIBRARY } from '@/constants/exercises';

export type LearningPhase = 'initial' | 'calibrating' | 'optimized' | 'plateau';

export interface ExerciseIntel {
  exerciseName: string;
  sfr: SFRScore;
  status: ExerciseStatus;
  feedback: ExerciseFeedback | undefined;
}

export interface CoachInsight {
  id: string;
  type: 'volume' | 'recovery' | 'exercise' | 'plateau' | 'general';
  title: string;
  body: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  createdAt: number;
}

interface AICoachState {
  learningPhase: LearningPhase;
  totalWorkoutsAnalyzed: number;
  exerciseFeedback: Record<string, ExerciseFeedback>;
  insights: CoachInsight[];

  analyzeWorkoutHistory: (workouts: WorkoutSummaryData[], readiness: ReadinessEntry[]) => void;
  getExerciseIntel: (exerciseName: string) => ExerciseIntel;
  getTopExercises: (muscleGroup: string, limit?: number) => ExerciseIntel[];
  getLearningPhase: () => { phase: LearningPhase; progress: number; label: string };
}

let insightCounter = 0;

export const useAICoachStore = create<AICoachState>((set, get) => ({
  learningPhase: 'initial',
  totalWorkoutsAnalyzed: 0,
  exerciseFeedback: {},
  insights: [],

  analyzeWorkoutHistory: (workouts, readiness) => {
    const feedback: Record<string, ExerciseFeedback> = {};

    for (const w of workouts) {
      for (const ex of w.exercises) {
        const key = ex.exerciseName;
        if (!feedback[key]) {
          feedback[key] = {
            exerciseName: key,
            avgMuscleConnection: 0,
            avgRpe: 0,
            totalSets: 0,
            painReports: 0,
            lastPerformed: w.completedAt,
          };
        }
        const fb = feedback[key];
        const completedSets = ex.sets.filter((s) => s.isCompleted);
        const mcValues = completedSets
          .map((s) => s.muscleConnection)
          .filter((v): v is number => v !== null);
        const rpeValues = completedSets.map((s) => s.rpe).filter((v): v is number => v !== null);

        fb.totalSets += completedSets.length;
        if (mcValues.length > 0) {
          fb.avgMuscleConnection =
            (fb.avgMuscleConnection * (fb.totalSets - completedSets.length) +
              mcValues.reduce((a, b) => a + b, 0)) /
            fb.totalSets;
        }
        if (rpeValues.length > 0) {
          fb.avgRpe =
            (fb.avgRpe * (fb.totalSets - completedSets.length) +
              rpeValues.reduce((a, b) => a + b, 0)) /
            fb.totalSets;
        }
        if (w.completedAt > fb.lastPerformed) fb.lastPerformed = w.completedAt;
      }
    }

    const totalSetsLogged = Object.values(feedback).reduce((s, f) => s + f.totalSets, 0);
    let phase: LearningPhase = 'initial';
    if (totalSetsLogged >= 200) phase = 'optimized';
    else if (totalSetsLogged >= 50) phase = 'calibrating';
    if (workouts.length >= 20) {
      const recent = workouts.slice(0, 8);
      const older = workouts.slice(8, 16);
      if (recent.length >= 4 && older.length >= 4) {
        const recentAvg = recent.reduce((s, w) => s + w.totalVolume, 0) / recent.length;
        const olderAvg = older.reduce((s, w) => s + w.totalVolume, 0) / older.length;
        if (Math.abs(recentAvg - olderAvg) / olderAvg < 0.05) phase = 'plateau';
      }
    }

    const insights: CoachInsight[] = [];

    const blacklisted = Object.entries(feedback).filter(([name]) => {
      const lib = EXERCISE_LIBRARY.find((e) => e.name === name);
      const sfr = computeSFR(lib?.sfrRating ?? 5, feedback[name]);
      return determineExerciseStatus(sfr, feedback[name]) === 'blacklisted';
    });
    for (const [name] of blacklisted) {
      insights.push({
        id: `insight-${insightCounter++}`,
        type: 'exercise',
        title: `Consider dropping ${name}`,
        body: 'Pain has been reported frequently with this exercise. Try an alternative.',
        confidence: 0.8,
        priority: 'high',
        createdAt: Date.now(),
      });
    }

    const avgRpeAll = workouts
      .slice(0, 5)
      .map((w) => w.averageRpe)
      .filter((v): v is number => v !== null);
    if (avgRpeAll.length >= 3) {
      const avg = avgRpeAll.reduce((a, b) => a + b, 0) / avgRpeAll.length;
      if (avg > 9) {
        insights.push({
          id: `insight-${insightCounter++}`,
          type: 'recovery',
          title: 'Training intensity is very high',
          body: `Average RPE of ${avg.toFixed(1)} over recent sessions. Consider a deload week.`,
          confidence: 0.75,
          priority: 'high',
          createdAt: Date.now(),
        });
      }
    }

    const recentReadiness = readiness.filter((r) => r.surveyedAt > Date.now() - 7 * 86400000);
    if (recentReadiness.length >= 3) {
      const avgSleep =
        recentReadiness.reduce((s, r) => s + r.sleepQuality, 0) / recentReadiness.length;
      if (avgSleep < 2.5) {
        insights.push({
          id: `insight-${insightCounter++}`,
          type: 'recovery',
          title: 'Sleep quality has been low',
          body: 'Poor sleep impacts recovery and performance. Focus on sleep hygiene.',
          confidence: 0.7,
          priority: 'medium',
          createdAt: Date.now(),
        });
      }
    }

    if (phase === 'plateau') {
      insights.push({
        id: `insight-${insightCounter++}`,
        type: 'plateau',
        title: 'Potential training plateau detected',
        body: 'Volume has stagnated over recent weeks. Consider varying rep ranges or exercise selection.',
        confidence: 0.6,
        priority: 'medium',
        createdAt: Date.now(),
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: `insight-${insightCounter++}`,
        type: 'general',
        title: 'Keep up the consistency',
        body: 'Your training is progressing well. Stay consistent with your program.',
        confidence: 0.5,
        priority: 'low',
        createdAt: Date.now(),
      });
    }

    set({
      exerciseFeedback: feedback,
      learningPhase: phase,
      totalWorkoutsAnalyzed: workouts.length,
      insights: insights.sort((a, b) => {
        const p = { high: 0, medium: 1, low: 2 };
        return p[a.priority] - p[b.priority];
      }),
    });
  },

  getExerciseIntel: (exerciseName) => {
    const { exerciseFeedback } = get();
    const lib = EXERCISE_LIBRARY.find((e) => e.name === exerciseName);
    const fb = exerciseFeedback[exerciseName];
    const sfr = computeSFR(lib?.sfrRating ?? 5, fb);
    return {
      exerciseName,
      sfr,
      status: determineExerciseStatus(sfr, fb),
      feedback: fb,
    };
  },

  getTopExercises: (muscleGroup, limit = 5) => {
    const { exerciseFeedback } = get();
    const matching = EXERCISE_LIBRARY.filter((e) =>
      e.muscleGroups.some((g) => g.toLowerCase() === muscleGroup.toLowerCase()),
    );
    return matching
      .map((e) => {
        const fb = exerciseFeedback[e.name];
        const sfr = computeSFR(e.sfrRating, fb);
        return {
          exerciseName: e.name,
          sfr,
          status: determineExerciseStatus(sfr, fb),
          feedback: fb,
        };
      })
      .filter((e) => e.status !== 'blacklisted')
      .sort((a, b) => b.sfr.score - a.sfr.score)
      .slice(0, limit);
  },

  getLearningPhase: () => {
    const { learningPhase, totalWorkoutsAnalyzed } = get();
    const labels: Record<LearningPhase, string> = {
      initial: 'Getting to know you',
      calibrating: 'Learning your patterns',
      optimized: 'Fully personalized',
      plateau: 'Plateau — time for change',
    };
    let progress = 0;
    if (learningPhase === 'initial') progress = Math.min(totalWorkoutsAnalyzed / 5, 1) * 25;
    else if (learningPhase === 'calibrating')
      progress = 25 + Math.min(totalWorkoutsAnalyzed / 15, 1) * 50;
    else progress = 100;

    return { phase: learningPhase, progress, label: labels[learningPhase] };
  },
}));
