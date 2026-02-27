import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Colors } from '@/constants/Colors';
import { Button, Card } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, skipAuth } = useAuthStore();

  const handleAuth = () => {
    haptics.success();
    signIn({
      id: 'user-1',
      email: email || 'user@apex.app',
      name: email ? email.split('@')[0] : 'Athlete',
    });
    router.replace('/(auth)/onboarding');
  };

  const handleSkip = () => {
    haptics.light();
    skipAuth();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Brand ────────────────────────────────── */}
          <View style={s.brand}>
            <View style={s.logoCircle}>
              <FontAwesome name="bolt" size={32} color={Colors.accent} />
            </View>
            <Text style={s.brandTitle}>Apex Hypertrophy</Text>
            <Text style={s.brandSub}>The ultimate training operating system</Text>
          </View>

          {/* ── Form ─────────────────────────────────── */}
          <Card variant="elevated" style={s.formCard}>
            <Text style={s.formTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Email</Text>
              <View style={s.inputWrap}>
                <FontAwesome
                  name="envelope-o"
                  size={14}
                  color={Colors.textTertiary}
                  style={s.inputIcon}
                />
                <TextInput
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textTertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Password</Text>
              <View style={s.inputWrap}>
                <FontAwesome
                  name="lock"
                  size={15}
                  color={Colors.textTertiary}
                  style={s.inputIcon}
                />
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>
            </View>

            <Button
              title={isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleAuth}
              style={s.authBtn}
            />

            <Pressable
              onPress={() => {
                haptics.selection();
                setIsSignUp(!isSignUp);
              }}
            >
              <Text style={s.toggleText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={s.toggleLink}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
              </Text>
            </Pressable>
          </Card>

          {/* ── Divider ──────────────────────────────── */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or continue with</Text>
            <View style={s.dividerLine} />
          </View>

          {/* ── Social ───────────────────────────────── */}
          <View style={s.socialRow}>
            <SocialButton icon="apple" label="Apple" />
            <SocialButton icon="google" label="Google" />
          </View>

          {/* ── Biometric ────────────────────────────── */}
          <Pressable
            style={s.biometricBtn}
            onPress={() => {
              haptics.medium();
              handleAuth();
            }}
          >
            <FontAwesome name="hand-stop-o" size={20} color={Colors.textSecondary} />
            <Text style={s.biometricText}>Sign in with Biometrics</Text>
          </Pressable>

          {/* ── Skip ─────────────────────────────────── */}
          <Pressable onPress={handleSkip} style={s.skipBtn}>
            <Text style={s.skipText}>Skip for now</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialButton({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
}) {
  return (
    <Pressable style={s.socialBtn} onPress={() => haptics.light()}>
      <FontAwesome name={icon} size={18} color={Colors.textPrimary} />
      <Text style={s.socialLabel}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },

  brand: { alignItems: 'center', marginTop: 48, marginBottom: 36 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 45, 45, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  brandSub: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center' },

  formCard: { marginBottom: 24 },
  formTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },

  inputGroup: { marginBottom: 18 },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10, width: 18 },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 15,
    paddingVertical: 14,
  },

  authBtn: { marginTop: 8, marginBottom: 16 },

  toggleText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  toggleLink: { color: Colors.accent, fontWeight: '700' },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginHorizontal: 16,
  },

  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  socialLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },

  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    marginBottom: 12,
  },
  biometricText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },

  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipText: { color: Colors.textTertiary, fontSize: 14 },
});
