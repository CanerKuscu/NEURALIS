# NEURALIS - Anti-Brain-Rot Learning Ecosystem

> **Dijital dikkat dağınıklığını psikolojik sorumluluk ve sosyal sonuçlar aracılığıyla ortadan kaldıran, üst düzey, oyunlaştırılmış öğrenme platformu.**
> *(High-end, gamified learning platform that eliminates digital distraction through psychological accountability and social consequences.)*

---

## 🧠 Ne İşe Yarar? (What is it good for?)

Neuralis, modern dünyanın en büyük problemlerinden biri olan "beyin çürümesine" (brain-rot) ve dijital dikkat dağınıklığına karşı geliştirilmiş bir odaklanma ve öğrenme ekosistemidir. 
- **Öğrenme Alışkanlığı Kazandırır:** Kullanıcıları her gün düzenli olarak öğrenmeye teşvik eder.
- **Ertelemeyi (Procrastination) Engeller:** Sadece kişisel değil, sosyal sorumluluklar yükleyerek erteleme hastalığını yener.
- **Odaklanmayı Artırır:** Yapay zeka destekli analizlerle kullanıcının zayıf yönlerini bulur ve onlara odaklanmasını sağlar.
- **Kullanım Alanları:** Yeni bir dil öğrenmek, yazılım dillerinde ustalaşmak, sınavlara hazırlanmak veya günlük okuma/çalışma hedeflerini tutturmak için mükemmel bir araçtır.

## ⚙️ Nasıl Çalışır? (How does it work?)

Uygulama, klasik öğrenme platformlarından (örneğin Duolingo) farklı olarak "acımasız" bir psikolojik altyapı üzerine kuruludur:

1. **Gölge Tilki (Shadow Fox) ve Ölümcül Seri (Dying Streak):** Öğrenme serinizi devam ettirmek için 24 saatiniz vardır. Son 2 saate girdiğinizde "Nöral Çürüme" (Neural Decay) evresi başlar; görsel ve işitsel uyarıcılarla uygulama stres yaratır. Eğer süreyi kaçırırsanız seriniz tamamen sıfırlanır.
2. **Sosyal Bağımlılık (Synapse Links):** Arkadaşlarınızla kaderinizi birleştirirsiniz. **Shared Fate Protocol** sayesinde, eğer biriniz görevini yapmazsa, **her ikinizin de serisi sıfırlanır.** Bu, yoğun bir sosyal baskı ve sorumluluk mekanizması yaratır.
3. **Küresel Hiyerarşi:** Başarınız sadece puanlarla değil; "(Doğruluk x Hız) + (Seri Bonusu x 1.5)" formülüyle hesaplanan rekabetçi bir lig sisteminde değerlendirilir. Bronz'dan "Shadow Legend" seviyesine kadar yükselme şansı sunar.
4. **Yapay Zeka Gölge Eğitmen (AI Shadow Tutor):** Sokratik sorgulama yöntemiyle çalışan yapay zeka (Claude/GPT-4o), yaptığınız hataları analiz eder, size doğrudan cevabı vermek yerine doğruyu bulduracak sorular sorar ve zorluğu anlık olarak sizin performansınıza göre ayarlar.

---

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
├── src/
│   ├── components/            # Reusable UI components
│   ├── config/                # App configuration (Supabase client, etc.)
│   ├── constants/             # Theme, colors, spacing tokens
│   ├── context/               # React contexts (Theme, Language, Toast)
│   ├── data/                  # Static data & seed files
│   ├── hooks/                 # Custom React hooks
│   ├── i18n/                  # Internationalization (8 languages, RTL)
│   ├── locales/               # Translation files
│   ├── providers/             # Provider components
│   ├── services/              # Business logic services
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

## Testing

```bash
# Run all tests
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

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
