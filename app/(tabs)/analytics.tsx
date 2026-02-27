import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { Colors } from '@/constants/Colors';

const TIME_RANGES = ['4 weeks', '8 weeks', '12 weeks', 'All'] as const;

export default function AnalyticsScreen() {
  const [selectedRange, setSelectedRange] = useState<string>('8 weeks');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            color: Colors.textPrimary,
            fontSize: 28,
            fontWeight: '800',
            marginTop: 8,
          }}
        >
          Analytics
        </Text>
        <Text
          style={{
            color: Colors.textSecondary,
            fontSize: 14,
            marginTop: 4,
            marginBottom: 20,
          }}
        >
          Track your progress over time
        </Text>

        {/* Time Range Selector */}
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            marginBottom: 24,
          }}
        >
          {TIME_RANGES.map((range) => (
            <Pressable
              key={range}
              onPress={() => setSelectedRange(range)}
              style={{
                backgroundColor: selectedRange === range ? Colors.accent : Colors.surface,
                borderRadius: 20,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  color: selectedRange === range ? '#FFFFFF' : Colors.textSecondary,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {range}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Stat Cards Grid (2x2) */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard icon="🔥" value="0" label="DAY STREAK" />
            <StatCard icon="🏋️" value="1" label="WORKOUTS" />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard icon="📊" value="4" label="TOTAL SETS" />
            <StatCard icon="📅" value="1" label="PER WEEK" />
          </View>
        </View>

        {/* Weekly Volume Chart Placeholder */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: Colors.textPrimary,
              fontSize: 16,
              fontWeight: '700',
              marginBottom: 4,
            }}
          >
            Weekly Volume
          </Text>
          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 12,
              marginBottom: 20,
            }}
          >
            Sets completed per week
          </Text>
          <View
            style={{
              height: 160,
              borderRadius: 8,
              backgroundColor: Colors.surfaceLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: Colors.textTertiary, fontSize: 13 }}>
              Chart renders with Victory Native
            </Text>
          </View>
        </View>

        {/* Muscle Group Distribution */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: Colors.textPrimary,
              fontSize: 16,
              fontWeight: '700',
              marginBottom: 16,
            }}
          >
            Muscle Group Distribution
          </Text>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: Colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 24,
                  fontWeight: '800',
                }}
              >
                4
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Total Sets</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: Colors.accent,
              }}
            />
            <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>Chest 4 (100%)</Text>
          </View>
        </View>

        {/* Recent Workouts */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
              Recent Workouts
            </Text>
            <Text style={{ color: Colors.accent, fontSize: 14, fontWeight: '600' }}>See All</Text>
          </View>
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 12,
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <View>
                <Text
                  style={{
                    color: Colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  Push
                </Text>
                <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>Fri, Jan 16</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
                    4
                  </Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 10 }}>sets</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700' }}>
                    0 min
                  </Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 10 }}>time</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: Colors.accent, fontSize: 16, fontWeight: '700' }}>8.5</Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 10 }}>RPE</Text>
                </View>
              </View>
            </View>
            <View style={{ gap: 6 }}>
              {[
                { name: 'Rear Delt Flyes', sets: '1 sets' },
                { name: 'Incline Dumbbell Press', sets: '0 sets' },
                { name: 'Pull-Ups', sets: '0 sets' },
              ].map((exercise) => (
                <View
                  key={exercise.name}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>{exercise.name}</Text>
                  <Text style={{ color: Colors.textTertiary, fontSize: 13 }}>{exercise.sets}</Text>
                </View>
              ))}
              <Text style={{ color: Colors.textTertiary, fontSize: 12, fontStyle: 'italic' }}>
                +3 more exercises
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
      }}
    >
      <Text style={{ fontSize: 20, marginBottom: 8 }}>{icon}</Text>
      <Text
        style={{
          color: Colors.accent,
          fontSize: 32,
          fontWeight: '800',
          marginBottom: 4,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: Colors.textSecondary,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
