import 'dotenv/config';

export default {
  "expo": {
    "name": "Neuralis",
    "slug": "neuralis",
    "scheme": "neuralis",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/icon.png",
      "backgroundColor": "#2ECC71"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.neuralis.app",
      "privacyManifests": {
        "NSPrivacyAccessedAPITypes": [
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
            "NSPrivacyAccessedAPITypeReasons": [
              "CA92.1"
            ]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryDiskSpace",
            "NSPrivacyAccessedAPITypeReasons": [
              "E174.1"
            ]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategorySystemBootTime",
            "NSPrivacyAccessedAPITypeReasons": [
              "35F9.1"
            ]
          }
        ]
      },
      "infoPlist": {
        "UIBackgroundModes": [
          "audio",
          "remote-notification"
        ]
      }
    },
    "android": {
      "package": "com.neuralis.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "edgeToEdgeEnabled": true,
      "predictiveBackGestureEnabled": false,
      "permissions": [
        "NOTIFICATIONS",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#A020F0",
          "sounds": [
            "./assets/audio/notification.mp3"
          ]
        }
      ],
      [
        "expo-av"
      ],
      "expo-font",
      "expo-localization",
      "expo-router",
      [
        "@sentry/react-native/expo",
        {
          "organization": process.env.EXPO_PUBLIC_SENTRY_ORG || "YOUR_SENTRY_ORG",
          "project": "neuralis"
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "1e6e43bd-fc11-422d-b292-d2f19852b41a"
      },
      "privacyPolicyUrl": "https://neuralis.app/privacy",
      "termsOfServiceUrl": "https://neuralis.app/terms"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/1e6e43bd-fc11-422d-b292-d2f19852b41a"
    }
  }
};