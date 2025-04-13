# INSTALL EXPO

```bash
npx create-expo-app@latest --template blank-typescript
```

# ROUTER

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

# ADD TO

## `metro.config.js`

```javascript
process.env.EXPO_ROUTER_APP_ROOT = "app";

const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
```

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

# ADD TO

## `metro.config.js`

```javascript
process.env.EXPO_ROUTER_APP_ROOT = "app";

const { getDefaultConfig } = require("expo/metro-config");

module.exports = getDefaultConfig(__dirname);
```

## `package.json`

```json
{
  "name": "bnbsos",
  "version": "1.0.0",
  "main": "expo-router/entry", //ADD THIS
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~52.0.43",
    "expo-status-bar": "~2.0.1",
    "react": "18.3.1",
    "react-native": "0.76.9",
    "expo-router": "~4.0.20",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0",
    "expo-linking": "~7.0.5",
    "expo-constants": "~17.0.8"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@types/react": "~18.3.12",
    "typescript": "^5.3.3"
  },
  "private": true
}
```

## `app.json`

```json
{
  "expo": {
    "scheme": "bnbsos", //ADD scheme
    "name": "bnbsos",
    "slug": "bnbsos",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": ["expo-router"]
  }
}
```

# START EXPO

```bash
expo start
```

# CHECK LOGS

```bash
adb logcat | grep -i react-native
```

# CHECK CURRENT WATCHERS

```bash
cat /proc/sys/fs/inotify/max_user_watches
```

# INCREASE CURRENT WATCHERS

```bash
sudo sysctl fs.inotify.max_user_watches=524288
```

# APPLY THEM

```bash
sudo sysctl -p
```

# DOWNLOAD Exponent-2.32.19.apk IF in Downloads

```bash
adb install /home/user/Downloads/Exponent-2.32.19.apk
```
