import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../lib/auth-context";
import { BetterAuthProvider } from "../lib/better-auth-context";
import { SessionProvider } from "../components/SessionProvider";

export default function RootLayout() {
  return (
    <AuthProvider>
      <BetterAuthProvider>
        <SessionProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen
              name="reset-password"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="test-better-auth"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="contractors" options={{ headerShown: false }} />
            <Stack.Screen name="chat" options={{ headerShown: false }} />
          </Stack>
        </SessionProvider>
      </BetterAuthProvider>
    </AuthProvider>
  );
}
