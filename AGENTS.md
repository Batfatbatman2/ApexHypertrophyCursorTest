# AGENTS.md

## Project Overview

Apex Hypertrophy is a premium cross-platform hypertrophy training app (iOS, Android, Web) built with React Native + Expo SDK 55. The full feature spec lives at `.github/workflows/ApexHypertrophy2.7FeatureDocument.yml`. The development roadmap and task list is in `TODO.md`.

## Tech Stack

- **Framework**: React Native + Expo SDK 55 with Expo Router (file-based routing)
- **Language**: TypeScript (strict mode)
- **Styling**: NativeWind v4 (Tailwind CSS) + inline StyleSheet for complex layouts
- **State**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Local DB**: WatermelonDB (offline-first, SQLite)
- **Animations**: React Native Reanimated 4
- **Forms**: React Hook Form + Zod

## Cursor Cloud specific instructions

- **Dev server**: `npx expo start --web --port 8081` starts the web development server. The app renders at `http://localhost:8081`.
- **Lint**: `npx eslint . --ext .ts,.tsx` — zero errors expected; Prettier warnings auto-fix with `--fix`.
- **Type check**: `npx tsc --noEmit` — should pass clean.
- **Build verification**: `npx expo export --platform web` does a full static web export to verify compilation.
- **Design tokens**: All colors are in `constants/Colors.ts`. The app is dark-mode-only (`#0A0A0A` background, `#FF2D2D` accent red). Never use light theme colors.
- **Tab layout**: 4 tabs — Home (`index.tsx`), Program (`program.tsx`), Analytics (`analytics.tsx`), Settings (`settings.tsx`) — defined in `app/(tabs)/_layout.tsx`.
- **NativeWind**: Configured via `metro.config.js` (withNativeWind), `tailwind.config.js`, and `global.css`. The `global.css` import is in `app/_layout.tsx`.
- **Supabase**: Client in `lib/supabase.ts` uses `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` env vars. Currently placeholder values — set real values when Supabase project is created.
- **Haptics**: `lib/haptics.ts` wraps `expo-haptics` with no-op fallback on web.
- **Auth bypass**: The login screen (`app/(auth)/login.tsx`) has a "Skip for now" button. Use it for local testing since Supabase is not configured with real credentials.
- **Expo SDK 55**: Uses React 19.2, React Native 0.83. Some peer dependency warnings for `react-native-gesture-handler` are benign.
