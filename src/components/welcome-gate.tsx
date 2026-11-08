import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    ArrowRight,
    Database,
    GraduationCap,
    TrendingUp,
    WifiOff,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  onGetStarted: () => void;
  saving: boolean;
};

const C = {
  navy: "#142D60",
  background: "#101E42",
  white: "#FFFFFF",
};

export default function WelcomeGate({ onGetStarted, saving }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.background} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <Text style={styles.brand}>GRADESCOPE</Text>
          <GraduationCap size={25} color="#A8C5FF" />
        </View>

        <View style={styles.main}>
          <View style={styles.logo}>
            <GraduationCap size={66} color={C.white} />
          </View>

          <Text style={styles.eyebrow}>WELCOME TO GRADESCOPE</Text>

          <Text style={styles.title}>Your academic journey, simplified.</Text>

          <Text style={styles.description}>
            Manage your semesters, organize subjects, calculate ICA marks and
            track your academic progress — completely offline.
          </Text>

          <View style={styles.features}>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <WifiOff size={22} color="#A8C5FF" />
              </View>
              <Text style={styles.featureText}>Works completely offline</Text>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Database size={22} color="#A8C5FF" />
              </View>
              <Text style={styles.featureText}>
                Your data stays on your device
              </Text>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <TrendingUp size={22} color="#A8C5FF" />
              </View>
              <Text style={styles.featureText}>
                Track your academic performance
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottom}>
          <Pressable
            onPress={onGetStarted}
            disabled={saving}
            style={({ pressed }) => [
              styles.button,
              (pressed || saving) && styles.pressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={C.navy} />
            ) : (
              <>
                <Text style={styles.buttonText}>Get Started</Text>
                <ArrowRight size={21} color={C.navy} />
              </>
            )}
          </Pressable>

          <Text style={styles.footer}>No account required • 100% Offline</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: C.background,
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 32,
    justifyContent: "space-between",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    color: "#C5D6FB",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },

  main: {
    alignItems: "center",
    paddingVertical: 40,
  },

  logo: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: "#294678",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  eyebrow: {
    color: "#A8C5FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 13,
  },

  title: {
    color: C.white,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 39,
    textAlign: "center",
    marginBottom: 16,
  },

  description: {
    color: "#C7D7F4",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 30,
  },

  features: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#1A315C",
    padding: 19,
    gap: 18,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#294678",
    alignItems: "center",
    justifyContent: "center",
  },

  featureText: {
    flex: 1,
    color: C.white,
    fontWeight: "600",
    fontSize: 13,
  },

  bottom: {
    paddingTop: 15,
    alignItems: "center",
  },

  button: {
    width: "100%",
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  buttonText: {
    color: C.navy,
    fontSize: 16,
    fontWeight: "800",
  },

  footer: {
    color: "#A8BCE0",
    marginTop: 18,
    fontSize: 12,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.75,
  },
});
