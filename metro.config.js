// metro.config.js
process.env.EXPO_ROUTER_APP_ROOT = "app";

// const { getDefaultConfig } = require("expo/metro-config");

// module.exports = getDefaultConfig(__dirname);

const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
};

module.exports = config;
