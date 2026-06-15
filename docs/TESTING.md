# Testing Guide

## Overview

Neuralis uses **Jest** with **jest-expo** preset and **React Native Testing Library** for component testing.

## Setup

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Test Structure

```
__tests__/
├── components/           # UI component tests
│   ├── PrimaryButton.test.tsx
│   └── StateViews.test.tsx
├── services/             # Business logic tests
│   └── StreakService.test.ts
└── store/                # State management tests
    └── useNeuralisStore.test.ts
```

## Writing Tests

### Component Tests

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '../../src/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent title="Hello" />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <MyComponent title="Click Me" onPress={onPress} />
    );
    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### Service Tests

```typescript
import { myService } from '../../src/services/MyService';

describe('MyService', () => {
  it('calculates correctly', () => {
    const result = myService.calculate(10, 20);
    expect(result).toBe(30);
  });
});
```

### Store Tests

```typescript
import { useMyStore } from '../../src/store/useMyStore';

describe('MyStore', () => {
  beforeEach(() => {
    useMyStore.setState({ count: 0 }); // Reset state
  });

  it('increments count', () => {
    useMyStore.getState().increment();
    expect(useMyStore.getState().count).toBe(1);
  });
});
```

## Mocking

### Common Mocks (jest.setup.ts)

The following are automatically mocked:
- `@react-native-async-storage/async-storage`
- `expo-linear-gradient`
- `expo-haptics`
- `expo-blur`
- `expo-constants`
- `expo-router`
- `react-native-reanimated`
- `lucide-react-native` (all icons)
- Supabase client

### Custom Mocks

```typescript
// Mock a specific service
jest.mock('../../src/services/StreakService', () => ({
  streakService: {
    getStreakData: jest.fn().mockResolvedValue({ currentStreak: 5 }),
  },
}));
```

## E2E Testing (Future)

For end-to-end testing, we recommend:

### Maestro (Recommended for Expo)
```yaml
# .maestro/login_flow.yaml
appId: com.neuralis.app
---
- launchApp
- tapOn: "Email"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "password123"
- tapOn: "Login"
- assertVisible: "Home"
```

### Detox (Alternative)
```bash
npm install --save-dev detox @types/detox
npx detox init
```

## Coverage Goals

| Metric     | Current | Target |
| ---------- | ------- | ------ |
| Statements | --      | 30%+   |
| Branches   | --      | 30%+   |
| Functions  | --      | 30%+   |
| Lines      | --      | 30%+   |

Coverage targets will increase as the test suite grows.
