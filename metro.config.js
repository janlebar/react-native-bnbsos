// metro.config.js
process.env.EXPO_ROUTER_APP_ROOT = "app";

const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

// Stub react-native-maps on web to prevent bundling errors
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
  unstable_enablePackageExports: true, // Enable Better Auth package exports
  resolveRequest: (context, moduleName, platform) => {
    // Stub react-native-maps on web
    if (platform === "web" && moduleName === "react-native-maps") {
      return {
        filePath: path.resolve(__dirname, "stubs/react-native-maps.web.js"),
        type: "sourceFile",
      };
    }
    // Use default resolver for everything else
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
