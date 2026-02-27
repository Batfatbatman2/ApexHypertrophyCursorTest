import { ScrollView, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/Colors';

export default function ProgramScreen() {
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
            marginBottom: 24,
          }}
        >
          Programs
        </Text>

        {/* My Programs Section */}
        <Text
          style={{
            color: Colors.textPrimary,
            fontSize: 20,
            fontWeight: '700',
            marginBottom: 16,
          }}
        >
          My Programs
        </Text>

        {/* Active Program Card */}
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1.5,
            borderColor: Colors.cardHighlightBorder,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: Colors.textPrimary, fontSize: 22, fontWeight: '800' }}>Push</Text>
            <View
              style={{
                backgroundColor: Colors.accent,
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 3,
              }}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: '800',
                  textTransform: 'uppercase',
                }}
              >
                ACTIVE
              </Text>
            </View>
          </View>

          <Text
            style={{
              color: Colors.textSecondary,
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            Peas and stuff
          </Text>

          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
            <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>☰ 2 workouts</Text>
            <Text style={{ color: Colors.textSecondary, fontSize: 13 }}>🏋️ 10 exercises</Text>
          </View>

          <View
            style={{
              backgroundColor: 'rgba(255, 45, 45, 0.15)',
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 5,
              alignSelf: 'flex-start',
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: Colors.accent,
                fontSize: 11,
                fontWeight: '700',
                textTransform: 'uppercase',
              }}
            >
              HYPERTROPHY
            </Text>
          </View>

          <Text
            style={{
              color: Colors.textTertiary,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            ROLLING SCHEDULE
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {['1. Push', '2. Legs'].map((day) => (
              <View
                key={day}
                style={{
                  backgroundColor: Colors.surfaceLight,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                <Text
                  style={{
                    color: Colors.textPrimary,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>⚙️</Text>
              <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: '600' }}>
                Edit
              </Text>
            </Pressable>
            <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: Colors.error, fontSize: 14 }}>⊘</Text>
              <Text style={{ color: Colors.error, fontSize: 14, fontWeight: '600' }}>Delete</Text>
            </Pressable>
          </View>
        </View>

        {/* Create New Program Button */}
        <Pressable
          style={{
            borderWidth: 1.5,
            borderColor: Colors.accent,
            borderStyle: 'dashed',
            borderRadius: 16,
            padding: 20,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: Colors.accent, fontSize: 16, fontWeight: '700' }}>
            + Create New Program
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
