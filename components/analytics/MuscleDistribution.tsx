import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui';

interface MuscleGroupData {
  muscleGroup: string;
  sets: number;
  percentage: number;
  color: string;
}

interface MuscleDistributionProps {
  data: MuscleGroupData[];
  title?: string;
  totalSets?: number;
}

// Color palette for muscle groups
const MUSCLE_COLORS: Record<string, string> = {
  Chest: '#FF6B6B',
  Back: '#4ECDC4',
  Shoulders: '#45B7D1',
  Biceps: '#96CEB4',
  Triceps: '#FFEAA7',
  Quadriceps: '#DDA0DD',
  Hamstrings: '#98D8C8',
  Glutes: '#F7DC6F',
  Calves: '#BB8FCE',
  Core: '#85C1E9',
  Forearms: '#F8B500',
  Other: '#95A5A6',
};

export function MuscleDistribution({
  data,
  title = 'Muscle Distribution',
  totalSets,
}: MuscleDistributionProps) {
  // Calculate percentages if not provided
  const chartData = useMemo(() => {
    const total = totalSets || data.reduce((sum, d) => sum + d.sets, 0);
    return data.map((item) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.sets / total) * 100) : 0,
      color: item.color || MUSCLE_COLORS[item.muscleGroup] || '#95A5A6',
    }));
  }, [data, totalSets]);

  // Sort by percentage descending
  const sortedData = useMemo(
    () => [...chartData].sort((a, b) => b.percentage - a.percentage),
    [chartData]
  );

  // Create segments for donut chart
  const segments = useMemo(() => {
    const total = sortedData.reduce((sum, d) => sum + d.sets, 0);
    let cumulativePercent = 0;

    return sortedData.map((item) => {
      const percent = total > 0 ? (item.sets / total) * 100 : 0;
      const segment = {
        ...item,
        startAngle: cumulativePercent * 3.6, // Convert to degrees
        endAngle: (cumulativePercent + percent) * 3.6,
      };
      cumulativePercent += percent;
      return segment;
    });
  }, [sortedData]);

  // Simple bar representation instead of SVG donut (React Native compatibility)
  const maxSets = Math.max(...chartData.map((d) => d.sets), 1);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.content}>
        {/* Donut representation using bars */}
        <View style={styles.donutContainer}>
          <View style={styles.donutCenter}>
            <Text style={styles.donutTotal}>{totalSets || chartData.reduce((s, d) => s + d.sets, 0)}</Text>
            <Text style={styles.donutLabel}>Total Sets</Text>
          </View>

          {/* Horizontal bars forming a pseudo-donut effect */}
          <View style={styles.donutRings}>
            {[0.8, 0.6, 0.4].map((scale, i) => (
              <View
                key={i}
                style={[
                  styles.donutRing,
                  { transform: [{ scale }] },
                ]}
              >
                {segments.slice(0, 6).map((segment, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.ringSegment,
                      {
                        backgroundColor: segment.color,
                        flex: segment.percentage / 100,
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Legend with horizontal bars */}
        <View style={styles.legend}>
          {sortedData.slice(0, 8).map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={styles.legendLeft}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={styles.legendText} numberOfLines={1}>
                  {item.muscleGroup}
                </Text>
              </View>
              <View style={styles.legendRight}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        width: `${(item.sets / maxSets) * 100}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.legendValue}>
                  {item.sets} ({item.percentage}%)
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

// Container that fetches data from store
interface MuscleDistributionContainerProps {
  limit?: number;
}

export function MuscleDistributionContainer({ limit = 8 }: MuscleDistributionContainerProps) {
  // Mock data - would come from history store
  const mockData: MuscleGroupData[] = [
    { muscleGroup: 'Chest', sets: 18, percentage: 25, color: MUSCLE_COLORS.Chest },
    { muscleGroup: 'Back', sets: 15, percentage: 21, color: MUSCLE_COLORS.Back },
    { muscleGroup: 'Quadriceps', sets: 12, percentage: 17, color: MUSCLE_COLORS.Quadriceps },
    { muscleGroup: 'Shoulders', sets: 10, percentage: 14, color: MUSCLE_COLORS.Shoulders },
    { muscleGroup: 'Biceps', sets: 8, percentage: 11, color: MUSCLE_COLORS.Biceps },
    { muscleGroup: 'Triceps', sets: 6, percentage: 8, color: MUSCLE_COLORS.Triceps },
    { muscleGroup: 'Hamstrings', sets: 3, percentage: 4, color: MUSCLE_COLORS.Hamstrings },
    { muscleGroup: 'Glutes', sets: 0, percentage: 0, color: MUSCLE_COLORS.Glutes },
  ];

  return (
    <MuscleDistribution
      data={mockData.slice(0, limit)}
      totalSets={mockData.reduce((s, d) => s + d.sets, 0)}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  content: {
    gap: 20,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 1,
  },
  donutTotal: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  donutLabel: {
    fontSize: 12,
    color: '#888',
  },
  donutRings: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    flexDirection: 'row',
    overflow: 'hidden',
    opacity: 0.3,
  },
  ringSegment: {
    height: '100%',
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#CCC',
    flex: 1,
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    width: 60,
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  legendValue: {
    fontSize: 12,
    color: '#888',
    width: 55,
    textAlign: 'right',
  },
});
