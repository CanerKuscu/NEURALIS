# Architecture Overview

## High-Level Architecture

Neuralis follows a **feature-based modular architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│                   App Layer                      │
│              (Expo Router Screens)               │
│   app/(auth)/ · app/(tabs)/ · app/*.tsx          │
├─────────────────────────────────────────────────┤
│                 Component Layer                  │
│         src/components/ + src/hooks/             │
│   Reusable UI · Animations · State Views         │
├─────────────────────────────────────────────────┤
│              State Management Layer              │
│       src/store/ (Zustand) + src/context/        │
│   Global state · Theme · Language · Toast        │
├─────────────────────────────────────────────────┤
│               Service Layer                      │
│              src/services/ (30+)                 │
│   Business logic · API calls · Algorithms        │
├─────────────────────────────────────────────────┤
│              Infrastructure Layer                │
│        src/config/ · src/utils/ · src/i18n/      │
│   Supabase client · Logger · Translations        │
├─────────────────────────────────────────────────┤
│                External Services                 │
│      Supabase · Sentry · RevenueCat · EAS        │
└─────────────────────────────────────────────────┘
```

## Key Design Decisions

### 1. Zustand over Redux
- **Why**: Minimal boilerplate, built-in TypeScript support, no providers needed
- **Store**: Single store (`useNeuralisStore`) with sliced actions
- **Persistence**: Critical state persisted via AsyncStorage

### 2. Expo Router for Navigation
- **Why**: File-based routing, type-safe links, deep linking out of the box
- **Layout**: Nested layouts with `(auth)` group for unauthenticated screens
- **Tabs**: 6-tab layout (Home, Shop, Quests, League, Social, Profile)

### 3. Service Pattern
- Each feature domain has its own service class (e.g., `StreakService`, `DuelService`)
- Services handle business logic and Supabase API calls
- Components consume services through hooks, never directly

### 4. Theme System
- Dual theme (light/dark) with 370+ design tokens
- Color palette inspired by Duolingo's green primary
- System preference detection with manual override

## Data Flow

```
User Action → Component → Hook → Service → Supabase API
                ↓              ↓
          Zustand Store    AsyncStorage
                ↓
         UI Re-render
```

## Provider Stack (Root Layout)

```tsx
GestureHandlerRootView
  └── SafeAreaProvider
      └── ThemeProvider          // Dark/light mode
          └── LanguageProvider   // i18n + RTL
              └── SubscriptionProvider  // RevenueCat
                  └── ToastProvider     // Animated toasts
                      └── ErrorBoundary // Crash fallback
                          └── Stack     // Expo Router
```

## Service Catalog

| Service                | Responsibility                                    |
| ---------------------- | ------------------------------------------------- |
| `StreakService`        | 24h streak lifecycle, mercy challenges            |
| `AudioService`        | Audio playback with decay effects                 |
| `SynapseService`      | Social linking, shared fate protocol              |
| `RankingService`      | League system, XP calculations                    |
| `AITutorService`      | Claude/GPT-4o shadow tutor integration            |
| `DopamineMonitorService` | Brain rot detection & alerts                   |
| `AnalyticsService`    | Local analytics tracking                          |
| `AuthService`         | Supabase authentication                           |
| `NotificationService` | Push notification management                      |
| `DuelService`         | Real-time duel system                             |
| `SpacedRepetitionService` | SM-2 algorithm for flashcards                |
| `StoryModeService`    | Narrative learning experiences                    |
| `TournamentService`   | Competitive tournament system                     |
| `ChatService`         | In-app messaging with stickers                    |
| `LessonSeriesService` | Multi-lesson series management                    |

## Animation Strategy

1. **React Native Reanimated 2** — Core animation engine (UI thread)
2. **Moti** — Declarative animation primitives (fade, slide, scale, stagger)
3. **Lottie** — Complex mascot animations (fox states)
4. **Animated API** — Legacy animations being migrated to Reanimated

## Error Handling

- **ErrorBoundary** wraps the entire app for uncaught JS errors
- **Service-level try/catch** with Sentry reporting
- **StateViews** components for loading, empty, error, and offline states
- **Toast notifications** for user-facing errors
