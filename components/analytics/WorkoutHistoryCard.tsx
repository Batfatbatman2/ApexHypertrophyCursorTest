import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui';

interface WorkoutHistoryCardProps {
  workoutName: string;
  date: string;
  duration: string;
  sets: number;
  reps?: number;
  rpe?: number;
  volume?: number;
  prCount?: number;
  exercises?: {
    name: string;
    sets: number;
    reps: number;
    weight?: number;
  }[];
  expanded?: boolean;
  onPress?: () => void;
  onExpand?: () => void;
}

export function WorkoutHistoryCard({
  workoutName,
  date,
  duration,
  sets,
  reps,
  rpe,
  volume,
  prCount = 0,
  exercises = [],
  expanded = false,
  onPress,
  onExpand,
}: WorkoutHistoryCardProps) {
  const displayedExercises = expanded ? exercises : exercises.slice(0, 2);
  const hiddenCount = exercises.length - 2;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.workoutName}>{workoutName}</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.duration}>{duration}</Text>
            {prCount > 0 && (
              <View style={styles.prBadge}>
                <Text style={styles.prText}>+{prCount} PR{prCount > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sets}</Text>
            <Text style={styles.statLabel}>sets</Text>
          </View>
          {reps !== undefined && (
            <View style={styles.statDivider} />
          )}
          {reps !== undefined && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reps}</Text>
              <Text style={styles.statLabel}>reps</Text>
            </View>
          )}
          {rpe !== undefined && (
            <View style={styles.statDivider} />
          )}
          {rpe !== undefined && (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.rpeValue]}>{rpe}</Text>
              <Text style={styles.statLabel}>avg RPE</Text>
            </View>
          )}
          {volume !== undefined && (
            <View style={styles.statDivider} />
          )}
          {volume !== undefined && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatVolume(volume)}</Text>
              <Text style={styles.statLabel}>volume</Text>
            </View>
          )}
        </View>

        {exercises.length > 0 && (
          <>
            <View style={styles.exercises}>
              {displayedExercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseRow}>
                  <Text style={styles.exerciseName} numberOfLines={1}>
                    {exercise.name}
                  </Text>
                  <Text style={styles.exerciseDetails}>
                    {exercise.sets}×{exercise.reps}
                    {exercise.weight ? @ ${exercise.weight}lbs` : ''}
                  </Text>
                </View>
              ))}
            </View>

            {hiddenCount > 0 && (
              <TouchableOpacity onPress={onExpand} style={styles.expandButton}>
                <Text style={styles.expandText}>+{hiddenCount} more exercises</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </Card>
    </TouchableOpacity>
  );
}

// Container that connects to history store
interface WorkoutHistoryCardContainerProps {
  workoutId: string;
  onPress?: () => void;
}

export function WorkoutHistoryCardContainer({
  workoutId,
  onPress,
}: WorkoutHistoryCardContainerProps) {
  // Would fetch from history store
  // For now, return placeholder
  return (
    <WorkoutHistoryCard
      workoutName="Push Day"
      date="Jan 16, 2026"
      duration="45 min"
      sets={18}
      rpe={7.5}
      volume={12000}
      prCount={2}
      exercises={[
        { name: 'Bench Press', sets: 4, reps: 8, weight: 135 },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 50 },
        { name: 'Cable Flyes', sets: 3, reps: 12, weight: 25 },
      ]}
      onPress={onPress}
    />
  );
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }
  return volume.toString();
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  date: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  duration: {
    fontSize: 14,
    color: '#CCC',
  },
  prBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  prText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  rpeValue: {
    color: '#FF2D2D',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#333',
  },
  exercises: {
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 14,
    color: '#CCC',
    flex: 1,
  },
  exerciseDetails: {
    fontSize: 13,
    color: '#888',
  },
  expandButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  expandText: {
    fontSize: 13,
    color: '#FF2D2D',
    fontWeight: '500',
  },
});
