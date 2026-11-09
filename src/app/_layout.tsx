import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DefaultTheme, Stack, ThemeProvider } from "expo-router";

import * as SQLite from "expo-sqlite";

import WelcomeGate from "@/components/welcome-gate";

type AppState = "loading" | "welcome" | "ready" | "error";

const database = SQLite.openDatabaseAsync("gradescope.db");

// Keep false for normal app usage.
// True is only for temporary Welcome screen preview.
const DEV_PREVIEW_WELCOME = false;

async function readWelcomeStatus(): Promise<boolean> {
  const db = await database;

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  const result = await db.getFirstAsync<{
    value: string;
  }>("SELECT value FROM app_settings WHERE key = ?", ["welcome_completed"]);

  return result?.value === "true";
}

export default function RootLayout() {
  const [appState, setAppState] = useState<AppState>("loading");

  const [saving, setSaving] = useState(false);

  const initialize = useCallback(async () => {
    setAppState("loading");

    try {
      const completed = await readWelcomeStatus();

      if (DEV_PREVIEW_WELCOME) {
        setAppState("welcome");
      } else {
        setAppState(completed ? "ready" : "welcome");
      }
    } catch (error) {
      console.error("App initialization error:", error);
      setAppState("error");
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const getStarted = async () => {
    if (saving) return;

    try {
      setSaving(true);

      const db = await database;

      await db.runAsync(
        `INSERT INTO app_settings (key, value)
         VALUES (?, ?)
         ON CONFLICT(key)
         DO UPDATE SET value = excluded.value`,
        ["welcome_completed", "true"],
      );

      setAppState("ready");
    } catch (error) {
      console.error("Welcome save error:", error);
      setAppState("error");
    } finally {
      setSaving(false);
    }
  };

  if (appState === "loading") {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" />

        <ActivityIndicator size="large" color="#FFFFFF" />

        <Text style={styles.message}>Loading GradeScope...</Text>
      </View>
    );
  }

  if (appState === "error") {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" />

        <Text style={styles.errorTitle}>Unable to start GradeScope</Text>

        <Text style={styles.message}>
          Could not access your offline database.
        </Text>

        <Pressable style={styles.retryButton} onPress={initialize}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (appState === "welcome") {
    return <WelcomeGate onGetStarted={getStarted} saving={saving} />;
  }

  return (
    <ThemeProvider value={DefaultTheme}>
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
        {/* DASHBOARD */}
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        {/* SEMESTER MANAGER */}
        <Stack.Screen
          name="semesters"
          options={{
            title: "My Semesters",
            headerShown: true,
          }}
        />

        {/* SUBJECT MANAGER */}
        <Stack.Screen
          name="subjects"
          options={{
            title: "My Subjects",
            headerShown: true,
          }}
        />

        {/* ICA CALCULATOR */}
        <Stack.Screen
          name="ica"
          options={{
            title: "ICA Calculator",
            headerShown: true,
          }}
        />

        {/* FINAL EXAM PREDICTOR */}
        <Stack.Screen
          name="predictor"
          options={{
            title: "Final Exam Predictor",
            headerShown: true,
          }}
        />

        {/* EXISTING EXPLORE SCREEN */}
        <Stack.Screen
          name="explore"
          options={{
            title: "Explore",
            headerShown: true,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#101E42",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },

  message: {
    color: "#C7D7F4",
    fontSize: 14,
    textAlign: "center",
    marginTop: 15,
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
  },

  retryButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 25,
  },

  retryText: {
    color: "#142D60",
    fontWeight: "800",
  },
});
