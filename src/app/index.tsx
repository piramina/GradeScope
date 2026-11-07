import { router } from "expo-router";
import {
  ArrowUpRight,
  BookOpen,
  Calculator,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react-native";
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const C = {
  navy: "#142D60",
  blue: "#3164D6",
  background: "#F5F7FC",
  white: "#FFFFFF",
  text: "#17233B",
  muted: "#718096",
  border: "#E6EBF3",
};

export default function Dashboard() {
  const comingSoon = (title: string) => {
    Alert.alert(
      "Coming Soon",
      `${title} will be available in the next development stage.`,
    );
  };

  const actions = [
    {
      title: "ICA Calculator",
      subtitle: "Calculate your best 2 ICA marks",
      icon: Calculator,
      background: "#EAF1FF",
    },
    {
      title: "Final Exam Predictor",
      subtitle: "Calculate required final exam marks",
      icon: Target,
      background: "#F3ECFF",
    },
    {
      title: "GPA & CGPA",
      subtitle: "Calculate your academic GPA",
      icon: GraduationCap,
      background: "#E8F8F1",
    },
    {
      title: "Performance Analysis",
      subtitle: "Explore academic progress",
      icon: TrendingUp,
      background: "#FFF4E5",
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Welcome back 👋</Text>

            <Text style={styles.heading}>GradeScope</Text>

            <Text style={styles.subheading}>
              Your academic journey, simplified.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <GraduationCap size={27} color={C.blue} />
          </View>
        </View>

        {/* CGPA CARD */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>OVERALL CGPA</Text>

              <Text style={styles.heroValue}>
                3.34
                <Text style={styles.heroMax}> / 4.00</Text>
              </Text>
            </View>

            <View style={styles.heroBadge}>
              <Sparkles size={17} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.heroDescription}>
            Track your progress and achieve your academic goals.
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroBottom}>
            <View>
              <Text style={styles.heroSmallLabel}>Latest Semester GPA</Text>
              <Text style={styles.heroSmallValue}>3.48</Text>
            </View>

            <View>
              <Text style={styles.heroSmallLabel}>Completed Credits</Text>
              <Text style={styles.heroSmallValue}>22</Text>
            </View>
          </View>
        </View>

        {/* ACADEMIC OVERVIEW */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Academic Overview</Text>
          <ArrowUpRight size={19} color={C.blue} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <CalendarDays size={22} color={C.blue} />
            </View>

            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>Semesters</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <BookOpen size={22} color={C.blue} />
            </View>

            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Subjects</Text>
          </View>
        </View>

        {/* MANAGE SEMESTERS BUTTON */}
        <Pressable
          onPress={() => router.push("/semesters")}
          style={({ pressed }) => [
            styles.semesterCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.semesterIcon}>
            <CalendarDays size={23} color={C.blue} />
          </View>

          <View style={styles.semesterText}>
            <Text style={styles.semesterTitle}>Manage Semesters</Text>

            <Text style={styles.semesterSubtitle}>
              Add, edit and organize your semesters
            </Text>
          </View>

          <ChevronRight size={21} color={C.blue} />
        </Pressable>

        {/* QUICK ACTIONS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Pressable
              key={action.title}
              onPress={() => comingSoon(action.title)}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: action.background },
                ]}
              >
                <Icon size={23} color={C.blue} />
              </View>

              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{action.title}</Text>

                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>

              <ChevronRight size={20} color="#9AA7BB" />
            </Pressable>
          );
        })}

        {/* DEVELOPMENT STATUS */}
        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <Clock3 size={20} color={C.blue} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.noteTitle}>Your academic assistant</Text>

            <Text style={styles.noteDescription}>
              More academic features are coming soon.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>Keep learning. Keep improving. 🎓</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 50,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: C.muted,
    marginBottom: 5,
  },
  heading: {
    fontSize: 29,
    fontWeight: "800",
    color: C.text,
  },
  subheading: {
    fontSize: 13,
    color: C.muted,
    marginTop: 5,
  },
  headerIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: "#EAF1FF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  hero: {
    backgroundColor: C.navy,
    borderRadius: 25,
    padding: 24,
    marginBottom: 27,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroLabel: {
    color: "#BDD1FF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  heroValue: {
    color: C.white,
    fontSize: 43,
    fontWeight: "800",
    marginTop: 8,
  },
  heroMax: {
    color: "#C7D8FF",
    fontSize: 17,
    fontWeight: "500",
  },
  heroBadge: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: "#365BA0",
    alignItems: "center",
    justifyContent: "center",
  },
  heroDescription: {
    color: "#D5E0FA",
    fontSize: 12,
    marginTop: 10,
    lineHeight: 19,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "#426098",
    marginVertical: 22,
  },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroSmallLabel: {
    color: "#BDD1FF",
    fontSize: 11,
    marginBottom: 7,
  },
  heroSmallValue: {
    color: C.white,
    fontSize: 22,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 19,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 19,
    padding: 19,
    borderWidth: 1,
    borderColor: C.border,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EAF1FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  statValue: {
    fontSize: 27,
    fontWeight: "800",
    color: C.text,
  },
  statLabel: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
  },
  semesterCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#D8E3F7",
    marginBottom: 29,
  },
  semesterIcon: {
    width: 51,
    height: 51,
    borderRadius: 15,
    backgroundColor: "#EAF1FF",
    justifyContent: "center",
    alignItems: "center",
  },
  semesterText: {
    flex: 1,
    marginLeft: 13,
  },
  semesterTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },
  semesterSubtitle: {
    fontSize: 11,
    color: C.muted,
    marginTop: 5,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  actionIcon: {
    width: 51,
    height: 51,
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
    color: C.text,
  },
  actionSubtitle: {
    fontSize: 11,
    color: C.muted,
    marginTop: 5,
  },
  noteCard: {
    backgroundColor: "#EAF1FF",
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
  },
  noteIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: "#D7E5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  noteTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.navy,
  },
  noteDescription: {
    fontSize: 11,
    color: "#59709B",
    marginTop: 4,
  },
  footer: {
    textAlign: "center",
    marginTop: 29,
    color: C.muted,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
