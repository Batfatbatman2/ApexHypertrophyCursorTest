import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'highlight' | 'compact';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
}: StatCardProps) {
  const isCompact = variant === 'compact';
  const isHighlight = variant === 'highlight';

  return (
    <Card
      variant={isHighlight ? 'elevated' : 'default'}
      style={[styles.card, isCompact && styles.compactCard]}
    >
      <View style={styles.header}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[styles.title, isCompact && styles.compactTitle]}>{title}</Text>
      </View>

      <View style={styles.valueContainer}>
        <Text style={[styles.value, isHighlight && styles.highlightValue]}>
          {value}
        </Text>
        {trend && (
          <View
            style={[
              styles.trendBadge,
              trend.isPositive ? styles.trendPositive : styles.trendNegative,
            ]}
          >
            <Text style={styles.trendText}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </Text>
          </View>
        )}
      </View>

      {subtitle && (
        <Text style={[styles.subtitle, isCompact && styles.compactSubtitle]}>
          {subtitle}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    minWidth: 140,
  },
  compactCard: {
    padding: 12,
    minWidth: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  compactTitle: {
    fontSize: 12,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  highlightValue: {
    color: '#FF2D2D',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  compactSubtitle: {
    fontSize: 10,
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendPositive: {
    backgroundColor: 'rgba(0, 200, 100, 0.2)',
  },
  trendNegative: {
    backgroundColor: 'rgba(255, 45, 45, 0.2)',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
});
