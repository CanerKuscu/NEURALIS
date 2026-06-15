# Deployment Guide

## Prerequisites

- **EAS CLI**: `npm install -g eas-cli`
- **Expo Account**: Sign up at [expo.dev](https://expo.dev)
- **EAS Project**: Link your project with `eas init`

## Build Profiles

### Development
- Includes dev client for local debugging
- Internal distribution only

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Preview
- Internal testing build
- No dev tools, production-like behavior

```bash
eas build --profile preview --platform android
eas build --profile preview --platform ios
```

### Production
- Store-ready build
- Auto-incrementing version numbers

```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```

## Environment Variables

### EAS Build Secrets
Set sensitive values as EAS secrets (never in source code):

```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
eas secret:create --name EXPO_PUBLIC_RC_APPLE_KEY --value "appl_..."
eas secret:create --name EXPO_PUBLIC_RC_GOOGLE_KEY --value "goog_..."
eas secret:create --name SENTRY_AUTH_TOKEN --value "sntrys_..."
```

### Local Development
Use `.env` file (never committed to git):
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_APP_ENV=development
```

## OTA Updates

Neuralis uses EAS Update for over-the-air JavaScript updates:

```bash
# Update production channel
eas update --branch production --message "Bug fixes and performance"

# Update preview channel
eas update --branch preview --message "Testing new feature"
```

### Update Policy
- `runtimeVersion.policy: "appVersion"` — updates are scoped to app version
- Critical native changes require a new build
- JS-only changes can be pushed via OTA

## Store Submission

### Android (Google Play)
```bash
eas submit --platform android --profile production
```

Requirements:
- `google-services-key.json` for service account
- App listing, screenshots, and privacy policy

### iOS (App Store)
```bash
eas submit --platform ios --profile production
```

Requirements:
- Apple Developer account
- App Store Connect listing
- Privacy policy URL

## CI/CD Pipeline

See `.github/workflows/ci.yml` for automated:
1. **PR Checks**: lint, typecheck, test
2. **Build Triggers**: on release branch push
3. **Update Triggers**: on main branch push

## Pre-Release Checklist

- [ ] All tests passing (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Environment variables set in EAS
- [ ] Privacy policy URL active
- [ ] Terms of service URL active
- [ ] Sentry DSN configured
- [ ] RevenueCat keys set for production
- [ ] App icons and splash screen finalized
- [ ] Store listing prepared (screenshots, description)
- [ ] Version number incremented
