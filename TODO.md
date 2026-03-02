# Apex Hypertrophy — Development Roadmap & TODO

## Tech Stack Decision

### Why React Native + Expo (SDK 52+)

| Requirement | Solution | Why Best |
|---|---|---|
| Cross-platform (iOS, Android, Web) | **Expo + React Native Web** | Single TypeScript codebase; Expo Router supports all 3 platforms with file-based routing |
| 60 fps animations, glassmorphism | **React Native Reanimated 3 + Skia** | Runs on the UI thread; Skia enables GPU-accelerated custom drawing (progress rings, particles) |
| Offline-first local storage | **WatermelonDB** (SQLite) | Lazy-loaded observable queries, built-in sync primitives, handles thousands of workout records |
| Cloud sync & auth | **Supabase** (PostgreSQL) | Row-level security, real-time subscriptions, auth with biometric, edge functions for AI |
| Haptic feedback | **expo-haptics** | Native haptic engine access on iOS/Android, no-op on web |
| Biometric auth | **expo-local-authentication** | Face ID / Touch ID / fingerprint with single API |
| Subscriptions & IAP | **RevenueCat (react-native-purchases)** | Handles Apple/Google IAP, trials, receipt validation, cross-platform entitlements |
| Charts & visualizations | **Victory Native (Skia)** | GPU-rendered charts (bar, line, pie) with 60fps animations |
| Push notifications | **expo-notifications** + Supabase Edge Functions | Local + remote notifications, background support |
| Navigation | **Expo Router v4** | File-based routing, deep linking, tab navigation, modal support |
| State management | **Zustand** | Lightweight, TypeScript-first, works with React Native and persistence middleware |
| Form handling | **React Hook Form + Zod** | Performant forms with schema validation |
| Styling | **NativeWind (Tailwind CSS)** | Utility-first styling that works across all platforms |

### Full Stack Overview

```
┌─────────────────────────────────────────────────┐
│                   CLIENT (Expo)                  │
│  React Native + TypeScript + Expo Router         │
│  ┌───────────┐ ┌───────────┐ ┌───────────────┐  │
│  │ Reanimated│ │   Skia    │ │  NativeWind   │  │
│  │ Animations│ │ Rings/Gfx │ │   Styling     │  │
│  └───────────┘ └───────────┘ └───────────────┘  │
│  ┌───────────────────────────────────────────┐   │
│  │          WatermelonDB (SQLite)            │   │
│  │     Offline-first + Sync Engine          │   │
│  └───────────────────────────────────────────┘   │
│  ┌───────────┐ ┌───────────┐ ┌───────────────┐  │
│  │  Zustand  │ │RevenueCat │ │ expo-haptics  │  │
│  │   State   │ │    IAP    │ │ expo-bio-auth │  │
│  └───────────┘ └───────────┘ └───────────────┘  │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────┴──────────────────────────┐
│                 SUPABASE CLOUD                   │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │PostgreSQL│ │   Auth   │ │  Edge Functions │  │
│  │  (data)  │ │ (users)  │ │ (AI algorithms) │  │
│  └──────────┘ └──────────┘ └─────────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌─────────────────┐  │
│  │ Realtime │ │ Storage  │ │   Row-Level     │  │
│  │  (sync)  │ │ (exports)│ │   Security      │  │
│  └──────────┘ └──────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Project Structure

```
apex-hypertrophy/
├── app/                          # Expo Router screens (file-based routing)
│   ├── (tabs)/                   # Tab navigator group
│   │   ├── _layout.tsx           # Tab bar layout (Home, Program, Analytics, Settings)
│   │   ├── index.tsx             # Home screen
│   │   ├── program.tsx           # Program list screen
│   │   ├── analytics.tsx         # Analytics dashboard
│   │   └── settings.tsx          # Settings screen
│   ├── (auth)/                   # Auth flow group
│   │   ├── login.tsx
│   │   └── onboarding/
│   │       └── [step].tsx        # 8-step onboarding (dynamic route)
│   ├── workout/
│   │   ├── [id].tsx              # Active workout execution screen
│   │   └── summary/[id].tsx      # Post-workout summary
│   ├── program/
│   │   ├── create/
│   │   │   ├── basic-info.tsx    # Step 1: Name, description, goal
│   │   │   ├── exercises.tsx     # Step 2: Exercise selection
│   │   │   └── schedule.tsx      # Step 3: Build schedule
│   │   └── [id]/
│   │       ├── index.tsx         # Program detail view
│   │       └── edit.tsx          # Edit program
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx
├── components/
│   ├── ui/                       # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── ProgressRing.tsx      # Circular progress (Skia)
│   │   ├── AnimatedCounter.tsx
│   │   └── GlassmorphicCard.tsx
│   ├── home/
│   │   ├── HeroWorkoutCard.tsx   # "Up Next" hero card
│   │   ├── WeeklyVolumeRings.tsx # Volume progress rings row
│   │   ├── ComingUpScroll.tsx    # Horizontal upcoming workouts
│   │   ├── RecentWorkouts.tsx    # Recent workout list
│   │   └── StatsRow.tsx          # Bottom stats bar
│   ├── workout/
│   │   ├── SetRow.tsx            # Individual set row (weight/reps/checkbox)
│   │   ├── SetTypeIcon.tsx       # Colored set type icons
│   │   ├── SetTypePicker.tsx     # Set type selection modal
│   │   ├── RestTimer.tsx         # Circular rest timer overlay
│   │   ├── RPEModal.tsx          # RPE & feedback modal
│   │   ├── ExerciseHeader.tsx    # Exercise name + tags
│   │   └── UpNextPreview.tsx     # "Up Next" exercise preview
│   ├── program/
│   │   ├── ProgramCard.tsx       # Program list card
│   │   ├── ScheduleBuilder.tsx   # Drag-to-reorder schedule
│   │   ├── ExercisePicker.tsx    # Exercise library browser
│   │   └── GoalSelector.tsx      # Training goal selection
│   └── analytics/
│       ├── StatCard.tsx          # Stat card (streak, workouts, etc.)
│       ├── VolumeChart.tsx       # Weekly volume bar chart
│       ├── MuscleDistribution.tsx# Pie chart
│       └── WorkoutHistoryCard.tsx# Recent workout detail card
├── db/                           # WatermelonDB schema & models
│   ├── schema.ts                 # Database schema definition
│   ├── migrations.ts             # Schema migrations
│   ├── models/
│   │   ├── User.ts
│   │   ├── Program.ts
│   │   ├── Workout.ts
│   │   ├── WorkoutDay.ts
│   │   ├── Exercise.ts
│   │   ├── WorkoutSession.ts
│   │   ├── SetLog.ts
│   │   ├── PersonalRecord.ts
│   │   └── ReadinessSurvey.ts
│   └── sync.ts                   # Supabase sync adapter
├── lib/
│   ├── supabase.ts               # Supabase client init
│   ├── ai/                       # AI Coach algorithms
│   │   ├── sfr-scoring.ts        # Stimulus-to-Fatigue Ratio
│   │   ├── volume-tolerance.ts   # MEV/MRV tracking
│   │   ├── recovery-rate.ts      # Recovery algorithm
│   │   ├── plateau-detection.ts  # Plateau & deload logic
│   │   └── weekly-adaptation.ts  # Weekly adaptation runner
│   ├── haptics.ts                # Haptic feedback utilities
│   ├── timer.ts                  # Rest timer logic
│   └── pr-detection.ts           # PR detection engine
├── stores/                       # Zustand state stores
│   ├── auth-store.ts
│   ├── workout-store.ts          # Active workout session state
│   ├── timer-store.ts            # Rest timer state
│   └── settings-store.ts
├── constants/
│   ├── exercises.ts              # 211+ exercise library seed data
│   ├── colors.ts                 # Design system colors
│   ├── muscle-groups.ts          # 12 muscle group definitions
│   └── templates.ts              # PPL, Upper/Lower, etc. templates
├── hooks/
│   ├── useWorkoutSession.ts
│   ├── useRestTimer.ts
│   ├── usePRDetection.ts
│   ├── useWeeklyVolume.ts
│   └── useAICoach.ts
├── supabase/                     # Supabase project config
│   ├── migrations/               # PostgreSQL migrations
│   ├── functions/                # Edge Functions
│   │   ├── weekly-coach-report/
│   │   ├── sync-workout-data/
│   │   └── generate-pdf-export/
│   └── seed.sql                  # Exercise library seed
├── assets/                       # Images, fonts, animations
├── app.json                      # Expo config
├── tailwind.config.js            # NativeWind config
├── tsconfig.json
└── package.json
```

---

## Phase 0: Project Bootstrap & Dev Environment

- [x] **0.1** Initialize Expo project with TypeScript template (Expo SDK 55, tabs template)
- [x] **0.2** Install and configure core dependencies (Reanimated, NativeWind, Zustand, Supabase, Zod, etc.)
- [x] **0.3** Configure NativeWind/Tailwind with dark-mode-first theme (`tailwind.config.js`, `global.css`, `metro.config.js`)
- [x] **0.4** Configure Expo Router with tab layout and 4 screen groups (Home, Program, Analytics, Settings)
- [x] **0.5** Set up Supabase client (`lib/supabase.ts` — placeholder config, ready for env vars)
- [x] **0.6** Set up WatermelonDB schema placeholder (`db/schema.ts` with table names)
- [x] **0.7** Create design system tokens (`constants/Colors.ts`) matching mockup palette:
  - Background: `#0A0A0A` (pure dark)
  - Surface: `#1A1A1A` (cards)
  - Accent: `#FF2D2D` (primary red)
  - Success: `#22C55E` (completed sets)
  - Warmup: `#F97316` (orange)
  - Working: `#FF2D2D` (red)
  - Myo-Rep: `#06B6D4` (cyan)
  - Drop Set: `#8B5CF6` (purple)
  - Text Primary: `#FFFFFF`
  - Text Secondary: `#9CA3AF`
- [x] **0.8** Set up ESLint + Prettier (`.eslintrc.js`, `.prettierrc`)
- [x] **0.9** Configure EAS Build placeholder (`app.json` with bundleIdentifier/package)

---

## Phase 1: Design System & UI Primitives

Build the reusable component library that every screen depends on.

- [x] **1.1** `Button` — primary/secondary/ghost/danger variants, Reanimated spring press animation, haptic on press, sm/md/lg sizes (`components/ui/Button.tsx`)
- [x] **1.2** `Card` — default/highlighted/elevated variants, dark surface `#1A1A1A`, configurable padding (`components/ui/Card.tsx`)
- [x] **1.3** `GlassmorphicCard` — frosted glass effect with opacity + border for overlays (`components/ui/GlassmorphicCard.tsx`)
- [x] **1.4** `ProgressRing` — SVG circular progress ring (react-native-svg), inner text "0/18", label below (`components/ui/ProgressRing.tsx`)
- [x] **1.5** `BottomSheetModal` — slide-up bottom sheet with overlay + drag handle + keyboard avoiding (`components/ui/Modal.tsx`)
- [x] **1.6** `NumericInput` — large touch target, focused border highlight, number-pad keyboard, label (`components/ui/NumericInput.tsx`)
- [x] **1.7** `Badge` — accent/success/warning/error/muted/custom variants, sm/md sizes, uppercase text (`components/ui/Badge.tsx`)
- [x] **1.8** `TabBar` — refined 4-tab layout with active icon background glow, proper spacing (`app/(tabs)/_layout.tsx`)
- [x] **1.9** `AnimatedCounter` — numeric display with Reanimated-ready architecture (`components/ui/AnimatedCounter.tsx`)
- [x] **1.10** `SectionHeader` — title + optional action label pattern, haptic on action press (`components/ui/SectionHeader.tsx`)
- [x] **1.11** Haptic utility module — light/medium/heavy/selection/success/warning/error levels (`lib/haptics.ts`)
- [x] **1.12** All 4 tab screens refactored to use UI primitives — premium polish, proper spacing, real data patterns matching mockups
- [x] **1.13** Barrel export for all UI components (`components/ui/index.ts`)

---

## Phase 2: Authentication & Onboarding

- [x] **2.1** Supabase Auth setup — client configured (`lib/supabase.ts`), auth store with signIn/signOut/skipAuth (`stores/auth-store.ts`)
- [x] **2.2** Login screen — email/password form, Apple/Google social buttons, biometric sign-in, Sign Up toggle, Skip for now (`app/(auth)/login.tsx`)
- [x] **2.3** 8-step onboarding wizard with shared progress bar (`app/(auth)/onboarding.tsx`):
  1. Welcome — bolt icon, feature highlights, skip option
  2. Training Age — beginner/intermediate/advanced cards with emoji icons
  3. Training Goal — hypertrophy/strength/endurance/general with red selection border
  4. Equipment — full gym/home gym/bodyweight with descriptions
  5. Age + Gender — numeric input + pill selector (male/female/other/prefer not to say)
  6. Bodyweight — LBS/KG toggle + large centered numeric input
  7. Training Days — 2–7 day selector buttons + smart split recommendation card
  8. Injuries — multi-select chip grid (lower back, shoulders, knees, etc.)
- [x] **2.4** Seed initial AI learning profile from onboarding answers (`lib/ai/seed-profile.ts`) — MEV/MRV per muscle, volume sensitivity, recovery hours, learning phase
- [x] **2.5** Store onboarding state in Zustand (`stores/onboarding-store.ts`) + root layout auth routing (`app/_layout.tsx`)

---

## Phase 3: Data Layer — WatermelonDB Models & Schema

Define all local database models matching the feature spec.

- [x] **3.1** `User` model — profile fields, training age, goal, equipment, unit prefs, injuries (JSON), timestamps
- [x] **3.2** `Program` model — name, description, goal, isActive, scheduleType, userId, has_many workoutDays + workoutSessions
- [x] **3.3** `WorkoutDay` model — belongs_to Program, dayNumber, name, isRestDay, estimatedDuration, has_many programExercises
- [x] **3.4** `ProgramExercise` model — belongs_to WorkoutDay + Exercise, orderIndex, sets, reps, setType, notes
- [x] **3.5** `Exercise` model — name, muscleGroups (JSON), equipment, movementPattern, isCompound, sfrRating, cues, isCustom, status
- [x] **3.6** `WorkoutSession` model — programId, workoutDayId, userId, startTime, endTime, status, notes, has_many setLogs
- [x] **3.7** `SetLog` model — belongs_to WorkoutSession + Exercise, setNumber, setType, weight, reps, rpe, muscleConnection, isCompleted, notes, parentSetId (for drop sets)
- [x] **3.8** `PersonalRecord` model — exerciseId, userId, prType (weight/rep/volume), value, weight, reps, sessionId, achievedAt
- [x] **3.9** `ReadinessSurvey` model — userId, soreness, sleepQuality, stressLevel, energyLevel, notes, surveyedAt
- [x] **3.10** `AIProfile` model — userId, mevPerMuscle (JSON), mrvPerMuscle (JSON), optimalVolumeZone (JSON), volumeSensitivity, recoveryHours, stressMultiplier, fatigueIndex, learningPhase
- [x] **3.11** Full `appSchema` with 10 tables, indexed foreign keys, LokiJS adapter for web, migrations scaffold, 211 exercises seed data across 12 muscle groups

---

## Phase 4: Home Screen

Matching mockup screenshots 1, 2, and 4.

- [x] **4.1** Root tab layout with Home as default tab (done in Phase 0)
- [x] **4.2** Greeting header — time-based greeting + formatted date + "Apex Hypertrophy" title + workout/rest toggle button
- [x] **4.3** `HeroWorkoutCard` (`components/home/HeroWorkoutCard.tsx`) — two variants:
  - **Workout**: "UP NEXT · PUSH" label, workout name, exercise count, duration, red "START WORKOUT" button
  - **Rest Day**: moon icon, "Take time to recover", gray "REST DAY" button
- [x] **4.4** `WeeklyVolumeRings` (`components/home/WeeklyVolumeRings.tsx`) — SectionHeader + Card + row of SVG ProgressRings with labels
- [x] **4.5** `ComingUpScroll` (`components/home/ComingUpScroll.tsx`) — horizontal ScrollView with day labels, workout names, exercise counts
- [x] **4.6** `RecentWorkouts` (`components/home/RecentWorkouts.tsx`) — pressable cards with chevron, empty state, "See All" link
- [x] **4.7** `StatsRow` (`components/home/StatsRow.tsx`) — bottom stats with dividers (Workouts, Total Sets, PRs Set)
- [x] **4.8** Pull-to-refresh with RefreshControl (accent-colored spinner)

---

## Phase 5: Program Management

Matching mockup screenshots 3, 5, 6, and 9.

- [x] **5.1** Program list screen — store-driven with calendar strip, dynamic program cards, empty state
- [x] **5.2** `ProgramCard` component (`components/program/ProgramCard.tsx`) — ACTIVE badge, goal badge, workout/exercise counts, rolling schedule pills, Edit/Delete/Set Active actions
- [x] **5.3** Create Program wizard — Step 1: Basic Info (`app/program/create.tsx`):
  - Step indicator dots with active red + progress bar
  - Program Name input + Description textarea
  - Training Goal selector (Hypertrophy/Strength/Endurance/General) with red border + checkmark
  - Quick Start from Template section (4 templates)
  - Rolling Schedule info card
- [x] **5.4** Create Program wizard — Step 2: Build Schedule:
  - Add Workout / Rest Day buttons
  - Numbered day cards with reorder arrows + remove X
  - Inline exercise list per workout day
  - Exercise Picker with search, muscle group/equipment badges, compound tags
  - "Repeats from Day 1" indicator
- [x] **5.5** Create Program wizard — Step 3: Review:
  - Program name, goal badge, day/exercise counts
  - Full schedule breakdown with exercise details
  - SAVE PROGRAM button persists to store
- [x] **5.6** Program store (`stores/program-store.ts`) — full CRUD, wizard state, demo data, setActive
- [x] **5.7** Pre-built templates (`constants/templates.ts`) — PPL, Upper/Lower, Full Body, Bro Split with full exercise definitions
- [x] **5.8** Edit program — loads existing program into wizard, "Edit Program" header, "SAVE CHANGES" button, updates in-place
- [x] **5.9** Duplicate program — creates copy with "(Copy)" suffix, preserves all data, inactive by default

---

## Phase 6: Workout Execution Engine

Matching mockup screenshots 7, 8, and 12. This is the core feature.

- [x] **6.1** Workout session state machine (`stores/workout-store.ts`): idle → active → completed, tick timer, full exercise/set CRUD
- [x] **6.2** Workout execution screen (`app/workout/[id].tsx`): header (X/name/timer/counter), scrollable body, fixed footer nav
- [x] **6.3** Exercise header — large bold name, muscle group (red) + equipment (gray) Badge tags
- [x] **6.4** Set table — SET/PREVIOUS/WEIGHT/REPS columns, color-coded type icons, TextInput fields, green checkmark on complete
- [x] **6.5** Four set types with distinct icons/colors: Warmup (🔥 orange), Working (🎯 red), Myo-Rep (⚡ cyan), Drop Set (💧 purple)
- [x] **6.6** SetTypePicker BottomSheetModal — slide-up with all 4 types, checkmark on selected, instant apply
- [x] **6.7** Add set (green + button), remove set, change set type per-set
- [x] **6.9** MARK SET COMPLETE — validates weight+reps > 0, green checkmark, success haptic, completes first incomplete set
- [x] **6.10** UP NEXT preview card — next exercise name, muscle/equipment badges, set count
- [x] **6.11** Left/right arrow navigation between exercises in footer
- [x] **6.route** Wired from Home START WORKOUT → loads active program exercises → opens fullscreen workout modal
- [x] **6.8** Ghost/AI pre-fill from last session — looks up history store for matching exercises, pre-fills weight/reps, shows in PREV column
- [x] **6.12** Auto warm-up ramps — generates 3 warm-up sets at 50%/65%/80% of working weight with descending reps (12/8/5), hidden after warm-ups exist
- [x] **6.13** Quick-Swap — BottomSheetModal with search, filtered by primary muscle group, shows equipment/compound tags, replaces exercise in-place
- [x] **6.14** Per-set notes — notes field on ActiveSet, included in all set creation methods
- [ ] **6.15** Session persistence to DB (deferred — needs WatermelonDB integration)

---

## Phase 7: RPE & Feedback System

- [x] **7.1** `RPEModal` (`components/workout/RPEModal.tsx`) — auto-shows after set completion:
  - RPE bar selector 6.0–10.0 with half steps, color gradient (green → yellow → red)
  - Large RPE value + descriptive label (Very Easy / Moderate / Hard / Very Hard / Maximum Effort)
  - Muscle connection 1–5 stars with label (Weak / Moderate / Strong / Perfect)
  - Optional notes TextInput
  - "Save Feedback" primary button + "Skip for now" link
- [x] **7.2** Haptic feedback on RPE bar tap and star selection (`haptics.selection()`)
- [x] **7.3** Save RPE + muscleConnection to ActiveSet via `updateSet()` on submit; skip dismisses without saving

---

## Phase 8: Rest Timer

Matching mockup screenshot 13.

- [x] **8.1** `RestTimer` component (`components/workout/RestTimer.tsx`):
  - SVG circular countdown ring (red arc depleting over time)
  - Large time remaining in center ("1:29" + "REMAINING" label)
  - Quick Set buttons: 30s, 60s, 90s (default selected = red fill), 2m, 3m
  - Extend buttons: +15s, +30s, +60s (red outlined)
  - "Skip" gray button + "Pause/Resume" red button
- [x] **8.2** Timer store (`stores/timer-store.ts`):
  - Zustand countdown with 1s tick interval
  - Auto-start after RPE modal dismiss (respects `autoStartTimer` setting)
  - Configurable duration from settings (`defaultRestDuration`)
  - Pause/Resume toggle, skip, extend, setDuration
- [x] **8.3** Haptic alerts: light at 10s, medium at 5s, heavy at 0s (timer complete)
- [ ] **8.4** Lock screen / notification persistence (deferred — needs native expo-notifications)
- [x] **8.5** Timer integrated into workout screen, auto-starts after RPE submit/skip

---

## Phase 9: Workout Summary

- [x] **9.1** Post-workout summary screen:
  - Total session duration
  - Total volume (weight × reps sum)
  - Total sets completed
  - Average RPE
  - Exercise-by-exercise breakdown
  - PR highlights with celebration badges
- [x] **9.2** PR celebration if new records achieved (confetti + haptics)
- [x] **9.3** Share summary as branded image

---

## Phase 10: Analytics Dashboard

Matching mockup screenshots 10 and 11.

- [x] **10.1** Analytics screen layout:
  - "Analytics" header
  - Time range segmented control: 4W, 8W (default), 12W, All
- [x] **10.2** Stat cards row:
  - Streak (fire icon), Workouts (bolt icon), Sets (bar chart icon), PRs (trophy icon)
  - Large number + label below each
- [x] **10.3** Weekly Volume bar chart:
  - Sets per week with animated bars
  - X-axis: week labels, Y-axis: set count
  - Color-coded bars with value labels
- [x] **10.4** Muscle Group Distribution donut chart (SVG):
  - Colored segments per muscle group
  - Total sets in center
  - Horizontal bar breakdown with percentages
- [x] **10.5** Recent Workouts list:
  - Workout name + date + PR badge
  - Stats: sets, time, RPE (red number)
  - Expandable exercise breakdown with sets×reps @ weight
  - "+N more exercises" expandable
- [x] **10.6** Strength progression line charts per exercise — SVG dot+line chart with exercise selector chips, min/max labels, integrated into Analytics
- [x] **10.7** Correlation scatter plot — SVG readiness vs volume scatter in Analytics, renders with 2+ matching data points

---

## Phase 11: Personal Record (PR) System

- [x] **11.1** PR detection engine — runs on every completed set:
  - Weight PR (heaviest weight for given reps)
  - Rep PR (most reps at given weight)
  - Volume PR (weight × reps highest product)
- [x] **11.2** Celebration toast — golden PR toast with haptics + badge chips (non-blocking)
- [x] **11.3** PR history view per exercise — dates, values, PR timeline with color-coded dots
- [x] **11.4** PR counter widget on home screen (tappable, navigates to PR history)
- [x] **11.5** Badge system (Weight 🏋️ gold / Rep 🔁 green / Volume 📊 cyan)

---

## Phase 12: AI Coach & Adaptive Engine

- [x] **12.1** SFR scoring per exercise — `lib/ai/sfr-scoring.ts`: `(PopSFR × 0.3) + (Connection × 0.5) − (Pain × 0.2)`, confidence scaling, human-readable reasoning
- [x] **12.2** Exercise status system — Proven (high SFR + confidence) / Experimental / Blacklisted (>30% pain rate), auto-computed from workout history
- [ ] **12.3** Seven weekly adaptation algorithms (Supabase Edge Functions):
  1. Volume Tolerance — track MEV/MRV per muscle from set logs
  2. Recovery Rate — analyze RPE trends, insert rest days
  3. Exercise Compatibility — blacklist high-pain exercises
  4. Technique Effectiveness — RPE vs reps regression
  5. Stress Impact — readiness survey multiplier
  6. Plateau Recognition — detect stalls, generate deload weeks
  7. Autonomy Progression — learn from user overrides
- [x] **12.4** AI Coach store with learning phases — `stores/ai-coach-store.ts`: initial → calibrating → optimized → plateau, analyzes workout + readiness history
- [x] **12.5** Confidence + reasoning — every SFR score includes confidence (0-100%) and plain-English reasoning, AI Coach insights show confidence badge
- [x] **12.6** Daily Readiness Survey — full-screen modal with 4 colored metric sliders (soreness/sleep/stress/energy), live score calculation, notes, home screen integration with check-in prompt and score badge
- [x] **12.7** Weekly Coach Report (`/coach-report` route):
  - Headline summary with personalized message
  - Key metric tiles: workouts, sets, volume (with week-over-week delta), avg RPE
  - Readiness section: average score from daily check-ins
  - Volume vs targets heatmap: colored bars for all 12 muscle groups with target markers
  - Actionable advice: generated from under-trained muscles, high RPE, low readiness
  - Accessible via "Report" button in Analytics header
  - [ ] Export as PDF/image (deferred — needs Supabase Edge Function)

---

## Phase 13: Settings & Preferences

- [x] **13.1** Settings screen sections:
  - **Units**: Weight (lbs/kg) toggle with automatic conversion
  - **Rest Timer**: Default duration picker modal (6 presets: 30s–4m), auto-start toggle
  - **Haptics**: Global haptics toggle (Switch)
  - **Notifications**: Global notifications toggle (Switch)
  - **Volume Targets**: Per muscle group (12 groups) with +/− steppers and reset to defaults
  - **Theme**: Dark / Light / System pill selector
  - **Data**: Export modal (JSON + PDF options), Delete All Data confirmation modal
  - **Account**: Sign out
- [ ] **13.2** Persist settings in Zustand + MMKV (instant load) — deferred, needs AsyncStorage/MMKV
- [x] **13.3** "Delete All My Data" — confirmation modal with danger UX, resets all settings to defaults

---

## Phase 14: Subscription & Paywall (RevenueCat)

- [x] **14.1** RevenueCat SDK setup with Apple App Store + Google Play Store products
- [x] **14.2** Subscription plans: $9.99/month and $89/year
- [x] **14.3** 7-day free trial flow
- [x] **14.4** Cinematic paywall screen — blurred preview background + feature highlights + one-tap subscribe
- [x] **14.5** Entitlement checks on gated screens
- [x] **14.6** Subscription management (cancel, restore purchases)

---

## Phase 15: Cloud Sync (WatermelonDB ↔ Supabase)

- [x] **15.1** Supabase PostgreSQL schema matching WatermelonDB models
- [x] **15.2** Row-level security policies (users can only access own data)
- [x] **15.3** WatermelonDB sync adapter — pull/push via Supabase Edge Function
- [x] **15.4** Conflict resolution: last-write-wins with manual merge fallback for critical data
- [x] **15.5** Pending operation queue with exponential backoff retry
- [x] **15.6** Background sync trigger on network reconnect
- [x] **15.7** Sync status indicator in UI

---

## Phase 16: Polish & Performance

- [ ] **16.1** Glassmorphism effects on modals and overlays (blur + transparency)
- [x] **16.2** Micro-interactions — FadeInDown entrance animations on Home screen sections with staggered delays, Button spring press scales
- [ ] **16.3** Parallax scroll effects on detail screens
- [ ] **16.4** Confetti particle system (Skia) for PR celebrations
- [ ] **16.5** 60 fps audit — profile all screens, optimize re-renders
- [x] **16.6** Accessibility pass — accessibilityRole/Label/State on Button, tabBarAccessibilityLabel on all 4 tabs
- [ ] **16.7** Large touch targets audit (minimum 44pt)
- [x] **16.8** Error boundaries — AppErrorBoundary class component with retry button, wraps root layout
- [x] **16.9** Loading skeletons — Skeleton, SkeletonCard, SkeletonRow components with Reanimated shimmer animation

---

## Phase 17: Testing

- [ ] **17.1** Unit tests for AI algorithms (Jest)
- [ ] **17.2** Unit tests for PR detection, timer logic, sync conflict resolution
- [ ] **17.3** Component tests for key UI components (React Native Testing Library)
- [ ] **17.4** Integration tests for workout execution flow
- [ ] **17.5** E2E tests for critical paths (Detox or Maestro):
  - Onboarding → Create Program → Start Workout → Complete Set → PR Detection → Summary
- [ ] **17.6** Performance benchmarks for database queries with 1000+ sessions

---

## Phase 18: Deployment

- [ ] **18.1** EAS Build configuration for iOS + Android
- [ ] **18.2** App Store assets (screenshots, description, keywords)
- [ ] **18.3** Google Play Store assets
- [ ] **18.4** Web deployment (Vercel or Expo Web)
- [ ] **18.5** Supabase production project setup
- [ ] **18.6** RevenueCat production configuration
- [ ] **18.7** CI/CD pipeline (GitHub Actions): lint → test → build → deploy
- [ ] **18.8** Crash reporting (Sentry) + analytics (PostHog/Mixpanel)
- [ ] **18.9** App review submission

---

## Priority Execution Order

| Sprint | Phases | Duration (est.) | Deliverable |
|--------|--------|-----------------|-------------|
| 1 | 0 + 1 | 2 weeks | Project scaffold, design system, all primitives working |
| 2 | 2 + 3 | 1.5 weeks | Auth flow, onboarding, full local database |
| 3 | 4 + 5 | 2 weeks | Home screen + Program CRUD (core navigation complete) |
| 4 | 6 + 7 + 8 | 3 weeks | Workout execution engine (the flagship feature) |
| 5 | 9 + 10 + 11 | 2 weeks | Summary, Analytics, PR system |
| 6 | 12 | 2.5 weeks | AI Coach & adaptive algorithms |
| 7 | 13 + 14 + 15 | 2 weeks | Settings, subscriptions, cloud sync |
| 8 | 16 + 17 + 18 | 2 weeks | Polish, testing, deployment |
| **Total** | | **~15 weeks** | **Production-ready v1.0** |
