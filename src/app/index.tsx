import { router } from "expo-router";
import {
  BookOpen,
  Calculator,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  Target,
  TrendingUp,
} from "lucide-react-native";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const colors = {
  primary: "#1E40AF",
  dark: "#142D60",
  background: "#F5F7FC",
  white: "#FFFFFF",
  text: "#17233B",
  muted: "#718096",
  border: "#E6EBF3",
};

export default function Dashboard() {
  const actions = [
    {
      title: "ICA Calculator",
      subtitle: "Calculate your ICA marks",
      icon: Calculator,
      route: "/ica-calculator",
      color: "#EAF1FF",
    },
    {
      title: "Final Target",
      subtitle: "Predict required exam marks",
      icon: Target,
      route: "/final-predictor",
      color: "#F3ECFF",
    },
    {
      title: "GPA Calculator",
      subtitle: "Calculate semester GPA",
      icon: GraduationCap,
      route: "/gpa-calculator",
      color: "#E8F8F1",
    },
    {
      title: "Performance",
      subtitle: "Analyze your progress",
      icon: TrendingUp,
      route: "/performance",
      color: "#FFF4E5",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.heading}>GradeScope</Text>
            <Text style={styles.subheading}>
              Your academic journey, simplified.
            </Text>
          </View>
          <View style={styles.headerIcon}>
            <GraduationCap size={26} color={colors.primary} />
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>OVERALL CGPA</Text>
          <Text style={styles.heroValue}>
            3.34<Text style={styles.heroMax}> / 4.00</Text>
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroBottom}>
            <View>
              <Text style={styles.heroSmallLabel}>Latest Semester GPA</Text>
              <Text style={styles.heroSmallValue}>3.48</Text>
            </View>

            <View>
              <Text style={styles.heroSmallLabel}>Credits Completed</Text>
              <Text style={styles.heroSmallValue}>22</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Academic Overview</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <CalendarDays size={21} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Semesters</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <BookOpen size={21} color={colors.primary} />
            </View>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        {actions.map((action, index) => {
          const Icon = action.icon;

          return (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push(action.route as any)}
            >
              <View
                style={[styles.actionIcon, { backgroundColor: action.color }]}
              >
                <Icon size={23} color={colors.primary} />
              </View>

              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>

              <ChevronRight size={20} color="#9AA7BB" />
            </Pressable>
          );
        })}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Keep learning. Keep improving. 🎓
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  greeting: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  subheading: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 5,
  },
  headerIcon: {
    height: 54,
    width: 54,
    borderRadius: 18,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    backgroundColor: colors.dark,
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
  },
  heroLabel: {
    color: "#BFD1FA",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  heroValue: {
    color: colors.white,
    fontSize: 42,
    fontWeight: "800",
    marginTop: 9,
  },
  heroMax: {
    color: "#BFD1FA",
    fontSize: 17,
    fontWeight: "500",
  },
  heroDivider: {
    height: 1,
    backgroundColor: "#3E5685",
    marginVertical: 21,
  },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroSmallLabel: {
    fontSize: 11,
    color: "#BFD1FA",
    marginBottom: 6,
  },
  heroSmallValue: {
    fontSize: 21,
    color: colors.white,
    fontWeight: "700",
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "750",
    color: colors.text,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 29,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    height: 40,
    width: 40,
    backgroundColor: "#EAF1FF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  actionCard: {
    backgroundColor: colors.white,
    borderRadius: 17,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIcon: {
    height: 50,
    width: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    flex: 1,
    marginLeft: 14,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  actionSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 5,
  },
  pressed: {
    opacity: 0.7,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: colors.muted,
    fontSize: 12,
  },
});
