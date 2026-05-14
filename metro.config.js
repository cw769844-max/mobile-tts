const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required for @shopify/react-native-skia shader assets
config.resolver.assetExts.push('sksl');

module.exports = config;
