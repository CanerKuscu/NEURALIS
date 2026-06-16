import * as Linking from 'expo-linking';
import { Share } from 'react-native';

export const DeepLinkService = {
  /**
   * Create and share an invite link
   */
  shareInviteLink: async (userId: string) => {
    // Create a deep link like neuralis://sign-up?referrer=userId
    // In development (Expo Go), this might be exp://...
    const redirectUrl = Linking.createURL('sign-up', {
      queryParams: { referrer: userId },
    });

    const message = `Come join me on Neuralis! Let's learn together. 🚀\n${redirectUrl}`;

    try {
      const result = await Share.share({
        message,
        title: 'Join Neuralis',
        url: redirectUrl, // iOS only
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared via activity type: ' + result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  },

  /**
   * Get parsed URL on app launch
   */
  getInitialURL: async () => {
    const url = await Linking.getInitialURL();
    return url ? Linking.parse(url) : null;
  },
};
