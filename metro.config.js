const { getDefaultConfig } = require('expo/metro-config');
console.log('LOADING CUSTOM METRO CONFIG...');

const config = getDefaultConfig(__dirname);

// Enable require.context for Expo Router
config.transformer.unstable_allowRequireContext = true;

module.exports = config;
