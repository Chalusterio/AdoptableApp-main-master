import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  MD3LightTheme as DefaultTheme,
  PaperProvider,
} from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import PetProvider from "../context/PetContext";
import UserProvider from "../context/UserContext";
import { NotificationProvider } from "../context/NotificationContext";

// Define theme settings
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "white",
    secondary: "black",
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lilita: require("../assets/fonts/LilitaOne-Regular.ttf"),
    Lato: require("../assets/fonts/Lato-Regular.ttf"),
    LatoSemibold: require("../assets/fonts/Lato-Semibold.ttf"),
    LatoBold: require("../assets/fonts/Lato-Bold.ttf"),
  });

  // Prevent splash screen from hiding automatically
  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
        await SplashScreen.preventAutoHideAsync();
      }
    }

    prepare();
  }, [fontsLoaded]);

  // If fonts are still loading, return null or a loading state
  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <UserProvider>
            <PetProvider>
              <NotificationProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                >
                  <Stack.Screen name="index" options={{ title: "Splash" }} />
                  <Stack.Screen name="Login" options={{ title: "Login" }} />
                  <Stack.Screen name="Signup" options={{ title: "Signup" }} />
                  <Stack.Screen name="Options" options={{ title: "Options" }} />
                  <Stack.Screen
                    name="Lifestyle"
                    options={{ title: "Lifestyle" }}
                  />
                  <Stack.Screen
                    name="Preferences"
                    options={{ title: "Preferences" }}
                  />
                  <Stack.Screen name="Main" options={{ title: "Main" }} />
                  <Stack.Screen
                    name="ApproveAdoption"
                    options={{ title: "ApproveAdoption" }}
                  />
                </Stack>
              </NotificationProvider>
            </PetProvider>
          </UserProvider>
        </SafeAreaProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
