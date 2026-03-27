import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { BASE_URL } from "../constants"; // H-2: use environment-driven URL

// On web (Expo dev), better-auth fires GET /api/auth/get-session with
// `credentials: 'include'` (sends cookies).  The Next.js dev server is not
// configured to respond with Access-Control-Allow-Credentials: true for that
// route, so the browser blocks the request with a CORS error.
//
// This app authenticates via Bearer tokens, so cookie-based session polling is
// unnecessary.  Passing `credentials: "omit"` on web stops the browser from
// attaching cookies and removes the CORS preflight constraint.
//
// On native (iOS/Android) this option is not set so the expoClient plugin
// works exactly as designed.
const webFetchOptions: RequestInit | undefined =
  Platform.OS === "web" ? { credentials: "omit" } : undefined;

export const authClient = createAuthClient({
  baseURL: BASE_URL, // H-2: driven by EXPO_PUBLIC_BASE_URL env var, not hardcoded
  ...(webFetchOptions ? { fetchOptions: webFetchOptions } : {}),
  plugins: [
    expoClient({
      scheme: "myapp", // Must match your app.json scheme
      storagePrefix: "nativebnbsos", // Use your app name as prefix
      storage: SecureStore,
    }),
  ],
});





