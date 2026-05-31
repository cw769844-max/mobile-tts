module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets/plugin must be listed last.
    // Required by react-native-reanimated 4.x (Skia camera transforms,
    // token-drag shared values) — without it the app crashes on launch.
    plugins: ['react-native-worklets/plugin'],
  };
};
