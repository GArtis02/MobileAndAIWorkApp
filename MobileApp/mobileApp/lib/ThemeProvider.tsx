// lib/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";

type ThemeType = "light" | "dark";

export type ColorsType = {
  background: string;
  text: string;
  primary: string;
  inputBg: string;
  border: string;
  link: string;
  drawerActiveBackgroundColor: string;
  drawerInactiveBackgroundColor: string;
};

type ThemeContextType = {
  theme: ThemeType;
  toggleTheme: () => void;
  colors: ColorsType;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  colors: {
    background: "#fff",
    text: "#000",
    primary: "#6200ee",
    inputBg: "#fff",
    border: "#ccc",
    link: "#1e90ff",
    drawerActiveBackgroundColor: "#e0e0e0",
    drawerInactiveBackgroundColor: "#fff",
  },
});

const lightColors: ColorsType = {
  background: "#fff",
  text: "#000",
  primary: "#6200ee",
  inputBg: "#fff",
  border: "#ccc",
  link: "#1e90ff",
  drawerActiveBackgroundColor: "#D2BBA9",
  drawerInactiveBackgroundColor: "#fff",
};

const darkColors: ColorsType = {
  background: "#121212",
  text: "#fff",
  primary: "#bb86fc",
  inputBg: "#1e1e1e",
  border: "#555",
  link: "#bb86fc",
  drawerActiveBackgroundColor: "#5B0666",
  drawerInactiveBackgroundColor: "#121212",
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useSystemColorScheme();
  const [theme, setTheme] = useState<ThemeType>("light");

  useEffect(() => {
    const loadStoredTheme = async () => {
      const stored = await SecureStore.getItemAsync("theme");
      if (stored === "dark" || stored === "light") {
        setTheme(stored);
      } else {
        setTheme(systemScheme || "light");
      }
    };
    loadStoredTheme();
  }, [systemScheme]);

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    await SecureStore.setItemAsync("theme", newTheme);
  };

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
