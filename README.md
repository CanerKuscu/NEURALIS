# NEURALIS - Anti-Brain-Rot Learning Ecosystem

> **High-end, gamified learning platform that eliminates digital distraction through psychological accountability and social consequences.**

## Theme: Stealth & Intelligence

| Element    | Color                   |
| ---------- | ----------------------- |
| Background | Pure Black `#000000`    |
| Primary    | Neon Green `#2ECC71`    |
| Accent     | Royal Gold `#FFD700`    |

---

## Quick Start

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI**: `npm install -g eas-cli` (for builds & OTA updates)
- A **Supabase** project for backend
- *(Optional)* Android Studio / Xcode for native builds

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/your-org/neuralis.git
cd neuralis

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Create environment file
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start the development server
npm start
```

### Running on Devices

```bash
# Android
npm run android

# iOS (macOS only)
npm run ios

# Web (experimental)
npm run web
```

---

## Available Scripts

| Script              | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `npm start`         | Start Expo development server                        |
| `npm run android`   | Run on Android emulator/device                      |
| `npm run ios`       | Run on iOS simulator/device                          |
| `npm run web`       | Start web version                                    |
| `npm run lint`      | Run ESLint checks                                    |
| `npm run lint:fix`  | Auto-fix ESLint issues                               |
| `npm run format`    | Format code with Prettier                            |
| `npm run format:check` | Check formatting without changes                  |
| `npm run typecheck` | Run TypeScript type checking                         |
| `npm test`          | Run unit tests with Jest                             |
| `npm run test:watch`| Run tests in watch mode                              |
| `npm run test:coverage` | Run tests with coverage report                   |

---

## Project Structure

```
neuralis/
├── app/                       # Expo Router screens & layouts
│   ├── (auth)/                # Authentication flow (login, signup, etc.)
│   ├── (tabs)/                # Main tab navigator (Home, Shop, Quests, etc.)
│   ├── series/                # Dynamic series routes
│   ├── _layout.tsx            # Root layout with providers
│   └── *.tsx                  # Feature screens
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── animations/        # Moti-based animation primitives
│   │   ├── avatar/            # Avatar system components
│   │   ├── design-system/     # Core design system elements
│   │   ├── duo/               # Duolingo-style lesson UI
│   │   ├── league/            # League & ranking components
│   │   ├── ui/                # Generic UI (LoadingState, ErrorState, etc.)
│   │   ├── EnergyMeter/       # Energy display
│   │   ├── LeagueCard/        # League info card
│   │   ├── ShadowFox/         # Animated mascot
│   │   ├── StreakTimer/        # Streak countdown
│   │   └── SynapseLink/       # Social link display
│   ├── config/                # App configuration (Supabase client, etc.)
│   ├── constants/             # Theme, colors, spacing tokens
│   ├── context/               # React contexts (Theme, Language, Toast)
│   ├── data/                  # Static data & seed files
│   ├── hooks/                 # Custom React hooks
│   ├── i18n/                  # Internationalization (8 languages, RTL)
│   ├── locales/               # Translation files
│   ├── providers/             # Provider components
│   ├── services/              # Business logic services (30+ services)
│   ├── store/                 # Zustand global state
│   ├── theme/                 # Theme utilities
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Utility functions (logger, sounds)
├── __tests__/                 # Unit & integration tests
├── assets/                    # Images, animations, audio
├── docs/                      # Technical documentation
├── functions/                 # Cloud functions (Firebase/Supabase)
├── scripts/                   # Build & utility scripts
├── supabase/                  # Supabase migrations & edge functions
└── .github/                   # CI/CD workflows
```

---

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_APP_ENV=development
```

> **Security Note**: Never commit `.env` files. They are gitignored by default. Production keys should only be set in your EAS/CI environment.

---

## Tech Stack

| Technology             | Purpose                        |
| ---------------------- | ------------------------------ |
| Expo SDK 54            | Cross-platform development     |
| React Native 0.81      | Mobile UI framework            |
| TypeScript 5.9         | Type safety                    |
| Supabase               | Backend, auth & real-time DB   |
| Zustand                | Global state management        |
| React Native Reanimated| High-performance animations    |
| Moti                   | Declarative animation primitives|
| expo-router            | File-based routing             |
| i18n-js                | Internationalization           |
| Sentry                 | Crash & error tracking         |
| Jest + RTL             | Unit & integration testing     |
| EAS Build              | Cloud builds & OTA updates     |

---

## Core Features

### 1. Shadow Fox Mascot & Dying Streak
- **24-hour rolling window** — must complete daily task within 24h
- **Neural Decay Phase** — last 2h trigger visual/audio degradation
- **Final Mercy** — one difficult challenge to save streak (once per 24h)
- Visual states: Healthy → Warning → Neural Decay → Critical → Dead

### 2. Social Interdependency (Synapse Links)
- **Shared Fate Protocol**: If either partner misses deadline, BOTH streaks break
- Social accountability through consequences
- Partner streak visibility and warnings

### 3. Global Hierarchy (7+ Leagues)
- Bronze → Silver → Gold → Platinum → Diamond → Master → Shadow Legend
- Rank formula: `(Accuracy × Speed) + (StreakBonus × 1.5)`

### 4. AI Shadow Tutor
- Socratic error analysis with Claude/GPT-4o
- Adaptive difficulty based on performance

### 5. Internationalization
Full RTL support with 8 languages: English, Türkçe, العربية, 日本語, 简体中文, Deutsch, Français, Español

---

## Testing

```bash
# Run all tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

Tests are located in `__tests__/` and organized by type:
- `__tests__/components/` — Component render & interaction tests
- `__tests__/services/` — Service logic unit tests
- `__tests__/store/` — Zustand store tests

---

## Building & Deployment

### Development Build
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Preview Build
```bash
eas build --profile preview --platform all
```

### Production Build
```bash
eas build --profile production --platform all
```

### OTA Updates
```bash
eas update --branch production --message "Bug fixes"
```

---

## CI/CD

The project uses **GitHub Actions** for automated:
- Linting & type checking on every PR
- Unit test execution
- EAS build triggers for production releases

See `.github/workflows/` for pipeline configuration.

---

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes and add tests
3. Run `npm run lint:fix && npm run format && npm test`
4. Open a Pull Request

---

## License

MIT License — Built for maximum mental performance.

---

*"Your brain is rotting. GET BACK TO WORK."* 🦊
