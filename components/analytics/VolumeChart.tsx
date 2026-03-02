import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Card } from '@/components/ui';

interface WeeklyVolumeData {
  weekLabel: string;
  sets: number;
  volume: number;
}

interface VolumeChartProps {
  data: WeeklyVolumeData[];
  title?: string;
  showVolume?: boolean;
  maxBars?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const CHART_HEIGHT = 180;
const BAR_WIDTH = 32;
const BAR_GAP = 8;

export function VolumeChart({
  data,
  title = 'Weekly Volume',
  showVolume = false,
  maxBars = 8,
}: VolumeChartProps) {
  // Limit to last N weeks
  const chartData = useMemo(() => {
    const limited = data.slice(-maxBars);
    const maxSets = Math.max(...limited.map((d) => d.sets), 1);
    const maxVolume = Math.max(...limited.map((d) => d.volume), 1);

    return limited.map((item) => ({
      ...item,
      heightPercent: (item.sets / maxSets) * 100,
      volumeHeightPercent: showVolume ? (item.volume / maxVolume) * 100 : 0,
    }));
  }, [data, maxBars, showVolume]);

  const maxValue = Math.max(...chartData.map((d) => d.sets));

  // Calculate chart width
  const chartWidth = Math.max(
    screenWidth - 64,
    chartData.length * (BAR_WIDTH + BAR_GAP) + 40
  );

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={[styles.chartContainer, { height: CHART_HEIGHT }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>{maxValue}</Text>
          <Text style={styles.axisLabel}>{Math.round(maxValue / 2)}</Text>
          <Text style={styles.axisLabel}>0</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {chartData.map((item, index) => (
            <View key={index} style={styles.barWrapper}>
              {/* Value label above bar */}
              <Text style={styles.valueLabel}>{item.sets}</Text>

              {/* Bar */}
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    { height: `${item.heightPercent}%` },
                    item.sets >= maxValue && styles.barHighlight,
                  ]}
                />
                {showVolume && (
                  <View
                    style={[
                      styles.volumeBar,
                      { height: `${item.volumeHeightPercent}%` },
                    ]}
                  />
                )}
              </View>

              {/* Week label */}
              <Text style={styles.weekLabel}>{item.weekLabel}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF2D2D' }]} />
          <Text style={styles.legendText}>Sets</Text>
        </View>
        {showVolume && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00C8C8' }]} />
            <Text style={styles.legendText}>Volume (lbs)</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

// Props for fetching data from store
interface VolumeChartContainerProps {
  weeksBack?: number;
  showVolume?: boolean;
}

/**
 * Container component that fetches data from stores
 */
export function VolumeChartContainer({ weeksBack = 8, showVolume = false }: VolumeChartContainerProps) {
  // This would connect to the history store to get weekly data
  // For now, return mock data structure
  const mockData: WeeklyVolumeData[] = Array.from({ length: weeksBack }, (_, i) => ({
    weekLabel: `W${i + 1}`,
    sets: Math.floor(Math.random() * 20) + 10,
    volume: Math.floor(Math.random() * 5000) + 2000,
  }));

  return <VolumeChart data={mockData} showVolume={showVolume} />;
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
  chartContainer: {
    flexDirection: 'row',
  },
  yAxis: {
    width: 30,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  axisLabel: {
    fontSize: 10,
    color: '#666',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
    paddingLeft: 8,
    paddingBottom: 20,
  },
  barWrapper: {
    alignItems: 'center',
    width: BAR_WIDTH,
  },
  valueLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
  },
  barContainer: {
    width: BAR_WIDTH,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    backgroundColor: '#FF2D2D',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  barHighlight: {
    backgroundColor: '#FF5555',
  },
  volumeBar: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    backgroundColor: '#00C8C8',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    minHeight: 2,
  },
  weekLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#888',
  },
});
