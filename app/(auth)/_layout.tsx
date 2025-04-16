import React, { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { auth } from "../../lib/auth";

export default function AuthenticatedLayout() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const session = await auth();
      if (!session) {
        router.replace("/login");
      } else {
        setIsAuth(true);
      }
    };

    checkAuth();
  }, []);

  if (isAuth === null) return null; // or loading screen

  return <Stack />;
}
