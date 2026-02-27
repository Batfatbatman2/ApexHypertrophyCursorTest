import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Header */}
        <Text style={{ color: Colors.textSecondary, fontSize: 14, marginTop: 8 }}>
          {getGreeting()} · {formatDate()}
        </Text>
        <Text
          style={{
            color: Colors.textPrimary,
            fontSize: 28,
            fontWeight: '800',
            marginTop: 4,
            marginBottom: 20,
          }}
        >
          Apex Hypertrophy
        </Text>

        {/* Hero Workout Card */}
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
              color: Colors.textSecondary,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            UP NEXT · PUSH
          </Text>
          <Text
            style={{
              color: Colors.textPrimary,
              fontSize: 28,
              fontWeight: '800',
              marginBottom: 4,
            }}
          >
            Push
          </Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 14, marginBottom: 12 }}>
            6 exercises
          </Text>
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>⏱ 48 min</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>🏋️ 6 exercises</Text>
          </View>
          <View
            style={{
              backgroundColor: Colors.accent,
              borderRadius: 30,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 }}>
              START WORKOUT
            </Text>
          </View>
        </View>

        {/* Weekly Volume */}
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
              Weekly Volume
            </Text>
            <Text style={{ color: Colors.accent, fontSize: 14, fontWeight: '600' }}>See All</Text>
          </View>
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 16,
              padding: 20,
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}
          >
            {[
              { name: 'BACK', current: 0, target: 18 },
              { name: 'CHEST', current: 0, target: 16 },
              { name: 'QUADS', current: 0, target: 16 },
              { name: 'SHOULDERS', current: 0, target: 14 },
            ].map((muscle) => (
              <View key={muscle.name} style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    borderWidth: 3,
                    borderColor: Colors.surfaceBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      color: Colors.textPrimary,
                      fontSize: 13,
                      fontWeight: '700',
                    }}
                  >
                    {muscle.current}/{muscle.target}
                  </Text>
                </View>
                <Text
                  style={{
                    color: Colors.textSecondary,
                    fontSize: 10,
                    fontWeight: '600',
                    letterSpacing: 0.5,
                  }}
                >
                  {muscle.name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Coming Up */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              color: Colors.textPrimary,
              fontSize: 18,
              fontWeight: '700',
              marginBottom: 16,
            }}
          >
            Coming Up
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View
              style={{
                backgroundColor: Colors.surface,
                borderRadius: 12,
                padding: 16,
                marginRight: 12,
                width: 140,
              }}
            >
              <Text
                style={{
                  color: Colors.accent,
                  fontSize: 11,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                TOMORROW
              </Text>
              <Text
                style={{
                  color: Colors.textPrimary,
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 4,
                }}
              >
                Legs
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>4 exercises</Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>32 min</Text>
            </View>
          </ScrollView>
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
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text
                style={{
                  color: Colors.textPrimary,
                  fontSize: 16,
                  fontWeight: '700',
                  marginBottom: 4,
                }}
              >
                Push
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 12 }}>
                Jan 16 · 1 min · 4 sets
              </Text>
            </View>
            <Text style={{ color: Colors.textSecondary, fontSize: 18 }}>›</Text>
          </View>
        </View>

        {/* Bottom Stats */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            padding: 20,
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}
        >
          {[
            { value: '1', label: 'Workouts' },
            { value: '4', label: 'Total Sets' },
            { value: '1', label: 'PRs Set' },
          ].map((stat) => (
            <View key={stat.label} style={{ alignItems: 'center' }}>
              <Text
                style={{ color: Colors.accent, fontSize: 24, fontWeight: '800', marginBottom: 4 }}
              >
                {stat.value}
              </Text>
              <Text style={{ color: Colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
