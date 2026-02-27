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

- [ ] **0.1** Initialize Expo project with TypeScript template
  ```bash
  npx create-expo-app@latest apex-hypertrophy --template tabs
  ```
- [ ] **0.2** Install and configure core dependencies
  ```bash
  npx expo install expo-router expo-haptics expo-local-authentication
  npx expo install react-native-reanimated react-native-gesture-handler
  npx expo install @shopify/react-native-skia
  npm install nativewind tailwindcss zustand @supabase/supabase-js
  npm install react-hook-form zod @hookform/resolvers
  npm install @nozbe/watermelondb
  npm install victory-native
  npm install react-native-purchases
  ```
- [ ] **0.3** Configure NativeWind/Tailwind with dark-mode-first theme
- [ ] **0.4** Configure Expo Router with tab layout and screen groups
- [ ] **0.5** Set up Supabase project (local dev with `supabase init` + Docker)
- [ ] **0.6** Set up WatermelonDB schema and initial migrations
- [ ] **0.7** Create design system tokens (`constants/colors.ts`) matching mockup palette:
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
- [ ] **0.8** Set up ESLint + Prettier + Husky pre-commit hooks
- [ ] **0.9** Configure EAS Build for iOS/Android/Web

---

## Phase 1: Design System & UI Primitives

Build the reusable component library that every screen depends on.

- [ ] **1.1** `Button` component — primary (red filled), secondary (outlined), ghost variants; press animation via Reanimated; haptic on press
- [ ] **1.2** `Card` component — dark surface (`#1A1A1A`) with subtle border, rounded corners, optional red highlight border (see selected program card in mockup)
- [ ] **1.3** `GlassmorphicCard` — frosted glass effect with blur + transparency for overlays
- [ ] **1.4** `ProgressRing` (Skia) — circular SVG ring with animated fill, inner text (e.g., "0/18"), used in Weekly Volume section
- [ ] **1.5** `Modal` component — bottom sheet style with backdrop blur, used for Set Type picker, RPE modal, Rest Timer
- [ ] **1.6** `NumericInput` — large touch target number input for weight/reps fields
- [ ] **1.7** `Badge` component — small colored label (e.g., "ACTIVE" green/red, "HYPERTROPHY" red, "Barbell" gray, "Compound" red)
- [ ] **1.8** `TabBar` — custom bottom tab bar matching mockup: Home (house), Program (calendar), Analytics (bar chart), Settings (gear); red highlight for active tab
- [ ] **1.9** `AnimatedCounter` — number that animates up/down on change (for stats)
- [ ] **1.10** `SectionHeader` — "Weekly Volume" + "See All" red link pattern
- [ ] **1.11** Haptic utility module — light (navigation), medium (set complete), heavy (PR celebration), selection (toggles)

---

## Phase 2: Authentication & Onboarding

- [ ] **2.1** Supabase Auth setup — email/password + Apple Sign-In + Google Sign-In
- [ ] **2.2** Login screen — biometric unlock option via `expo-local-authentication`
- [ ] **2.3** 8-step onboarding flow with shared progress bar:
  1. Welcome / value prop
  2. Training age (beginner/intermediate/advanced)
  3. Primary goal (Hypertrophy / Strength / Endurance / General Fitness)
  4. Equipment access (Full Gym / Home Gym / Bodyweight)
  5. Age + Gender
  6. Bodyweight + unit selection (lbs/kg)
  7. Preferred training days per week (3–7 slider)
  8. Injury history (optional multi-select)
- [ ] **2.4** Seed initial AI learning profile from onboarding answers
- [ ] **2.5** Store onboarding state in Zustand + persist to WatermelonDB

---

## Phase 3: Data Layer — WatermelonDB Models & Schema

Define all local database models matching the feature spec.

- [ ] **3.1** `User` model — profile fields, training age, goal, equipment, unit prefs
- [ ] **3.2** `Program` model — name, description, goal, isActive, scheduleType (rolling/fixed)
- [ ] **3.3** `WorkoutDay` model — belongs to Program, dayNumber, name, isRestDay
- [ ] **3.4** `ProgramExercise` model — belongs to WorkoutDay, exerciseId, order, sets, reps, setType
- [ ] **3.5** `Exercise` model — name, muscleGroups[], equipment, movementPattern, isCompound, SFR, cues, isCustom
- [ ] **3.6** `WorkoutSession` model — date, programId, workoutDayId, startTime, endTime, status (active/completed/abandoned)
- [ ] **3.7** `SetLog` model — belongs to WorkoutSession, exerciseId, setNumber, setType (warmup/working/myorep/dropset), weight, reps, rpe, muscleConnection, isCompleted, notes
- [ ] **3.8** `PersonalRecord` model — exerciseId, type (weight/rep/volume), value, date, sessionId
- [ ] **3.9** `ReadinessSurvey` model — date, soreness, sleep, stress, energy, notes
- [ ] **3.10** `AIProfile` model — MEV/MRV per muscle, volumeSensitivity, recoveryHours, stressMultiplier, fatigueIndex, learningPhase
- [ ] **3.11** Write schema migrations and seed 211+ exercises from `constants/exercises.ts`

---

## Phase 4: Home Screen

Matching mockup screenshots 1, 2, and 4.

- [ ] **4.1** Root tab layout with Home as default tab
- [ ] **4.2** Greeting header — "Good evening" (time-based) + date + "Apex Hypertrophy" bold title
- [ ] **4.3** `HeroWorkoutCard` — shows next scheduled workout from active program:
  - "UP NEXT · PUSH" label
  - Workout name (large bold)
  - Exercise count + estimated duration
  - Red "START WORKOUT" button
  - **Rest Day variant**: moon icon, "Take time to recover" subtitle, gray "REST DAY" button
- [ ] **4.4** `WeeklyVolumeRings` — horizontal row of `ProgressRing` components:
  - Query completed sets this week per muscle group
  - Show `current/target` inside each ring (e.g., "0/18")
  - Muscle group label below (BACK, CHEST, QUADS, SHOULDERS)
  - "See All" link to full muscle breakdown
- [ ] **4.5** `ComingUpScroll` — horizontal ScrollView of upcoming workout cards:
  - "TOMORROW" / day name label (red text)
  - Workout name (bold)
  - Exercise count + estimated duration
- [ ] **4.6** `RecentWorkouts` section:
  - Workout name, date, duration, set count
  - Chevron to detail view
  - "See All" link
- [ ] **4.7** Bottom stats row: Workouts count, Total Sets, PRs Set (large red numbers)
- [ ] **4.8** Pull-to-refresh to re-query data

---

## Phase 5: Program Management

Matching mockup screenshots 3, 5, 6, and 9.

- [ ] **5.1** Program list screen (tab):
  - Rolling schedule calendar strip at top showing current week
  - "My Programs" section with program cards
- [ ] **5.2** `ProgramCard` component:
  - Program name + "ACTIVE" badge (green/red)
  - Description subtitle
  - Workout count + exercise count stats
  - Goal badge ("HYPERTROPHY")
  - "ROLLING SCHEDULE" label + workout name pills (1. Push, 2. Legs)
  - Edit + Delete buttons (with delete confirmation)
  - "Set Active" button for inactive programs
  - Red highlight border on selected/active card
- [ ] **5.3** Create Program wizard — Step 1: Basic Info:
  - Step indicator dots (1 of 3) with red active dot
  - "Program Name" text input
  - "Description (Optional)" textarea
  - "Training Goal" selector — cards for: Hypertrophy, Strength, Endurance, General Fitness (red border on selected)
  - "Rolling Schedule" info card at bottom with cycle visualization (Push > Pull > Legs > Repeat)
  - "CONTINUE" red button
- [ ] **5.4** Create Program wizard — Step 2: Exercise Selection:
  - Exercise library browser with search bar
  - Filter by muscle group, equipment, movement pattern
  - Exercise cards showing name, muscle group tags, SFR rating, compound/isolation badge
  - Add exercises to workout days
  - Custom exercise builder modal
- [ ] **5.5** Create Program wizard — Step 3: Build Schedule:
  - "Rolling Schedule" header with explanation text
  - "Your Schedule (N days)" with numbered workout/rest day cards
  - Each card: number badge, workout name, exercise count, "Add Exercises" button (dashed red border)
  - Rest Day cards with moon icon
  - Up/down arrow buttons for reordering
  - X button to remove
  - "Repeats from Day 1" indicator at bottom
  - "SAVE PROGRAM" red button
- [ ] **5.6** Program detail view — full schedule with all exercises listed
- [ ] **5.7** Edit program — modify name, exercises, schedule, goal
- [ ] **5.8** Duplicate program functionality
- [ ] **5.9** Pre-built templates: PPL, Upper/Lower, Full Body, Bro Split — shown in a "Templates" section during creation

---

## Phase 6: Workout Execution Engine

Matching mockup screenshots 7, 8, and 12. This is the core feature.

- [ ] **6.1** Workout session state machine in Zustand:
  - States: `idle → active → paused → completing → completed`
  - Persist to WatermelonDB on every change (crash recovery)
  - Resume detection on app start
- [ ] **6.2** Workout execution screen layout:
  - Header: X (close), workout name, timer (counting up), exercise counter "1/6"
  - Scrollable content area
  - Fixed bottom: "MARK SET COMPLETE" red button + left/right nav arrows
- [ ] **6.3** `ExerciseHeader` — exercise name (large bold), muscle group tag (red "Chest"), equipment tag (gray "Barbell")
- [ ] **6.4** Set table with columns: SET, PREVIOUS, WEIGHT, REPS, completion checkbox
  - Each row has set number, previous performance ghost text, weight input, reps input, green checkmark when complete
  - Set type icon on left (color-coded per type)
- [ ] **6.5** Four set types with distinct visuals:
  - **Warmup** — orange flame icon, lighter row background
  - **Working** — red target icon with subtle pulse animation
  - **Myo-Rep** — cyan lightning icon, "MR" label
  - **Drop Set** — purple/blue down-arrow icon, "D" label, with nested sub-rows (D1, D2, etc.) and "Add Drop Set" button
- [ ] **6.6** `SetTypePicker` modal — tap set icon to change type:
  - List: Warmup (flame), Working (target, checkmark if selected), Myo-Rep (lightning), Drop Set (cascade)
  - Smooth slide-up animation
- [ ] **6.7** Add/delete/insert sets with Reanimated layout animations
- [ ] **6.8** Ghost/AI pre-fill from last session's data (clear on first tap)
- [ ] **6.9** "MARK SET COMPLETE" action:
  - Validate weight + reps > 0
  - Green checkmark animation
  - Success haptic
  - Trigger RPE modal (if enabled)
  - Start rest timer (if auto-start enabled)
  - Check for PR
- [ ] **6.10** "UP NEXT" preview at bottom of screen — next exercise name, tags, set count
- [ ] **6.11** Left/right navigation between exercises with swipe gesture support
- [ ] **6.12** Auto-Calculated Warm-Up Ramps: 50% × 10, 70% × 5, 85% × 2 based on working weight
- [ ] **6.13** Quick-Swap button (lightning icon) — suggest anatomical alternatives
- [ ] **6.14** Per-set and per-exercise notes
- [ ] **6.15** Session persistence — save full state to DB; restore on reopen

---

## Phase 7: RPE & Feedback System

- [ ] **7.1** RPE modal — auto-shows after set completion:
  - RPE slider 6.0–10.0 with half steps
  - Color gradient (green → yellow → red)
  - Muscle connection 1–5 stars with sparkle animation
  - Optional notes field
  - Skip button with gentle nudge
- [ ] **7.2** Haptic feedback on slider movement
- [ ] **7.3** Save RPE + connection to `SetLog` record

---

## Phase 8: Rest Timer

Matching mockup screenshot 13.

- [ ] **8.1** Rest Timer overlay/modal:
  - Large circular countdown ring (red, Skia-drawn)
  - Time remaining in center (large "1:29" + "REMAINING" label)
  - Quick Set duration buttons: 30s, 60s, 90s (selected = red fill), 2m, 3m
  - Extend buttons: +15s, +30s, +60s (red outlined)
  - "Skip" button (gray) + "Pause" button (red)
- [ ] **8.2** Timer logic in Zustand store:
  - Countdown with 100ms precision
  - Auto-start option after set completion
  - Configurable default duration from settings
- [ ] **8.3** Haptic alerts at 10s, 5s, and 0s remaining
- [ ] **8.4** Lock screen / notification persistence (expo-notifications for background)
- [ ] **8.5** Timer survives navigation between screens

---

## Phase 9: Workout Summary

- [ ] **9.1** Post-workout summary screen:
  - Total session duration
  - Total volume (weight × reps sum)
  - Total sets completed
  - Average RPE
  - Exercise-by-exercise breakdown
  - PR highlights with celebration badges
- [ ] **9.2** PR celebration if new records achieved (confetti + haptics)
- [ ] **9.3** Share summary as branded image

---

## Phase 10: Analytics Dashboard

Matching mockup screenshots 10 and 11.

- [ ] **10.1** Analytics screen layout:
  - "Analytics" header + "Track your progress over time" subtitle
  - Time range selector tabs: 4 weeks, 8 weeks (default, blue fill), 12 weeks, All
- [ ] **10.2** Stat cards grid (2×2):
  - Day Streak (fire icon, red)
  - Workouts (dumbbell icon, red)
  - Total Sets (bar chart icon, red)
  - Per Week (calendar icon, red)
  - Large number + label below each
- [ ] **10.3** Weekly Volume bar chart (Victory Native):
  - Dual series: Sets (red bars) + Workouts (green bars)
  - X-axis: week labels (Jan 4, Jan 11, etc.)
  - Y-axis: count
  - Dashed grid lines
- [ ] **10.4** Muscle Group Distribution pie chart:
  - Colored segments per muscle group
  - Total sets in center
  - Legend showing muscle name + percentage
- [ ] **10.5** Recent Workouts list:
  - Workout name + date
  - Stats: sets, time, RPE (red number)
  - Exercise breakdown: exercise name + set count
  - "+N more exercises" expandable
- [ ] **10.6** Strength progression line charts per exercise
- [ ] **10.7** Correlation engine scatter plots (sleep vs strength, stress vs RPE)

---

## Phase 11: Personal Record (PR) System

- [ ] **11.1** PR detection engine — runs on every completed set:
  - Weight PR (heaviest weight for given reps)
  - Rep PR (most reps at given weight)
  - Volume PR (weight × reps highest product)
- [ ] **11.2** Celebration modal — confetti particles (Skia), multi-stage haptics, badge display
- [ ] **11.3** PR history view per exercise — dates, values, % improvement, link to session
- [ ] **11.4** PR counter widget on home screen
- [ ] **11.5** Badge system (Weight / Rep / Volume icons)

---

## Phase 12: AI Coach & Adaptive Engine

- [ ] **12.1** SFR scoring per exercise: `(PopSFR × 0.3) + (Connection × 0.5) − (Pain × 0.2)`
- [ ] **12.2** Exercise status system: Proven / Experimental / Blacklisted
- [ ] **12.3** Seven weekly adaptation algorithms (Supabase Edge Functions):
  1. Volume Tolerance — track MEV/MRV per muscle from set logs
  2. Recovery Rate — analyze RPE trends, insert rest days
  3. Exercise Compatibility — blacklist high-pain exercises
  4. Technique Effectiveness — RPE vs reps regression
  5. Stress Impact — readiness survey multiplier
  6. Plateau Recognition — detect stalls, generate deload weeks
  7. Autonomy Progression — learn from user overrides
- [ ] **12.4** AI Profile model with learning phases: Initial → Calibrating → Optimized → Plateau
- [ ] **12.5** Confidence percentage + reasoning display on every recommendation
- [ ] **12.6** Daily Readiness Survey (morning modal): soreness, sleep, stress, energy sliders
- [ ] **12.7** Weekly Coach Report:
  - Headline summary
  - Key improvements
  - Volume heatmap vs MEV/MRV targets
  - Top correlations
  - Actionable advice
  - Export as PDF/image (via Supabase Edge Function)

---

## Phase 13: Settings & Preferences

- [ ] **13.1** Settings screen sections:
  - **Units**: Weight (lbs/kg) toggle with automatic conversion
  - **Rest Timer**: Default duration, auto-start toggle
  - **Haptics**: Global haptics toggle
  - **Notifications**: Global notifications toggle
  - **Volume Targets**: Per muscle group (12 groups) with reset to defaults
  - **Theme**: System / Light / Dark
  - **Data**: Export (JSON + PDF), Delete All Data
  - **Account**: Profile editing, logout, subscription management
- [ ] **13.2** Persist settings in Zustand + MMKV (instant load)
- [ ] **13.3** "Delete All My Data" — wipe local DB + Supabase data + audit trail

---

## Phase 14: Subscription & Paywall (RevenueCat)

- [ ] **14.1** RevenueCat SDK setup with Apple App Store + Google Play Store products
- [ ] **14.2** Subscription plans: $9.99/month and $89/year
- [ ] **14.3** 7-day free trial flow
- [ ] **14.4** Cinematic paywall screen — blurred preview background + feature highlights + one-tap subscribe
- [ ] **14.5** Entitlement checks on gated screens
- [ ] **14.6** Subscription management (cancel, restore purchases)

---

## Phase 15: Cloud Sync (WatermelonDB ↔ Supabase)

- [ ] **15.1** Supabase PostgreSQL schema matching WatermelonDB models
- [ ] **15.2** Row-level security policies (users can only access own data)
- [ ] **15.3** WatermelonDB sync adapter — pull/push via Supabase Edge Function
- [ ] **15.4** Conflict resolution: last-write-wins with manual merge fallback for critical data
- [ ] **15.5** Pending operation queue with exponential backoff retry
- [ ] **15.6** Background sync trigger on network reconnect
- [ ] **15.7** Sync status indicator in UI

---

## Phase 16: Polish & Performance

- [ ] **16.1** Glassmorphism effects on modals and overlays (blur + transparency)
- [ ] **16.2** Micro-interactions: button press scales, list item animations, page transitions
- [ ] **16.3** Parallax scroll effects on detail screens
- [ ] **16.4** Confetti particle system (Skia) for PR celebrations
- [ ] **16.5** 60 fps audit — profile all screens, optimize re-renders
- [ ] **16.6** WCAG AA accessibility audit — contrast, screen reader labels, dynamic type
- [ ] **16.7** Large touch targets audit (minimum 44pt)
- [ ] **16.8** Error boundaries and graceful error handling
- [ ] **16.9** Loading skeletons for async data

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
