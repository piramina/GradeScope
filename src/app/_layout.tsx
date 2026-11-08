import { DefaultTheme, Stack, ThemeProvider } from "expo-router";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <AnimatedSplashOverlay />

      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#142D60",
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "700",
          },
          contentStyle: {
            backgroundColor: "#F5F7FC",
          },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="semesters"
          options={{
            title: "My Semesters",
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="subjects"
          options={{
            title: "My Subjects",
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="explore"
          options={{
            title: "Explore",
          }}
        />

        <Stack.Screen
          name="ica"
          options={{
            title: "ICA Calculator",
            headerShown: true,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
