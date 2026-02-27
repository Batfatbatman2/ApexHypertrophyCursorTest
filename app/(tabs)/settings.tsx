import { ScrollView, Text, View, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { Colors } from '@/constants/Colors';

export default function SettingsScreen() {
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'kg'>('lbs');
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [autoStartTimer, setAutoStartTimer] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
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
          Settings
        </Text>

        {/* Units Section */}
        <SectionTitle title="Units" />
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <SettingRow label="Weight Unit" isLast>
            <View style={{ flexDirection: 'row', gap: 0 }}>
              {(['lbs', 'kg'] as const).map((unit) => (
                <Pressable
                  key={unit}
                  onPress={() => setWeightUnit(unit)}
                  style={{
                    backgroundColor: weightUnit === unit ? Colors.accent : Colors.surfaceLight,
                    paddingHorizontal: 18,
                    paddingVertical: 6,
                    borderRadius: unit === 'lbs' ? 8 : 8,
                    borderTopLeftRadius: unit === 'lbs' ? 8 : 0,
                    borderBottomLeftRadius: unit === 'lbs' ? 8 : 0,
                    borderTopRightRadius: unit === 'kg' ? 8 : 0,
                    borderBottomRightRadius: unit === 'kg' ? 8 : 0,
                  }}
                >
                  <Text
                    style={{
                      color: weightUnit === unit ? '#FFF' : Colors.textSecondary,
                      fontSize: 13,
                      fontWeight: '700',
                    }}
                  >
                    {unit.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </SettingRow>
        </View>

        {/* Rest Timer Section */}
        <SectionTitle title="Rest Timer" />
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <SettingRow label="Default Duration">
            <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>90s</Text>
          </SettingRow>
          <SettingRow label="Auto-Start Timer" isLast>
            <Switch
              value={autoStartTimer}
              onValueChange={setAutoStartTimer}
              trackColor={{ false: Colors.surfaceLight, true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
        </View>

        {/* General Section */}
        <SectionTitle title="General" />
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <SettingRow label="Haptic Feedback">
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: Colors.surfaceLight, true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
          <SettingRow label="Theme">
            <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>Dark</Text>
          </SettingRow>
          <SettingRow label="Notifications" isLast>
            <Text style={{ color: Colors.textSecondary, fontSize: 14 }}>On</Text>
          </SettingRow>
        </View>

        {/* Data Section */}
        <SectionTitle title="Data" />
        <View
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <SettingRow label="Export Data">
            <Text style={{ color: Colors.accent, fontSize: 14 }}>›</Text>
          </SettingRow>
          <SettingRow label="Delete All My Data" isLast>
            <Text style={{ color: Colors.error, fontSize: 14 }}>›</Text>
          </SettingRow>
        </View>

        {/* Version */}
        <Text
          style={{
            color: Colors.textTertiary,
            fontSize: 12,
            textAlign: 'center',
            marginTop: 8,
          }}
        >
          Apex Hypertrophy v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      {title}
    </Text>
  );
}

function SettingRow({
  label,
  children,
  isLast,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: Colors.divider,
      }}
    >
      <Text style={{ color: Colors.textPrimary, fontSize: 15 }}>{label}</Text>
      {children}
    </View>
  );
}
