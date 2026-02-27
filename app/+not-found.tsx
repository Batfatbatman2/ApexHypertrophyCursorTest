import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.background,
          padding: 20,
        }}
      >
        <Text
          style={{
            color: Colors.textPrimary,
            fontSize: 20,
            fontWeight: '700',
          }}
        >
          This screen doesn't exist.
        </Text>
        <Link href="/" style={{ marginTop: 16 }}>
          <Text style={{ color: Colors.accent, fontSize: 16 }}>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}
