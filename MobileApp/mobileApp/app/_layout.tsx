import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import { useFonts } from "expo-font";
import { ThemeProvider, useAppTheme } from "../lib/ThemeProvider";
import { SessionProvider, useSession } from "@/lib/session";
import * as SecureStore from "expo-secure-store";

SplashScreen.preventAutoHideAsync();

function AppLayout() {
  const { theme } = useAppTheme();
  const { session, loading } = useSession();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    async function checkSession() {
      const profileString = await SecureStore.getItemAsync("userProfile");
      if (!profileString) {
        router.replace("/_loginRegister/loginRegister");
      }
    }

    checkSession();
  }, [loaded, loading, session]);

  const navigationTheme =
    theme === "dark" ? NavigationDarkTheme : NavigationLightTheme;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(authorized)" options={{ headerShown: false }} />
        <Stack.Screen
          name="_loginRegister/loginRegister"
          options={{ title: "Welcome" }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppLayout />
    </ThemeProvider>
  );
}
