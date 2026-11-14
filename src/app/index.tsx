
import { router, useFocusEffect } from "expo-router";
import {
  ArrowUpRight,
  BookOpen,
  Calculator,
  CalendarDays,
  ChevronRight,
  Clock3,
  GraduationCap,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getSemesters, type Semester } from "../database/semester";
import { getSubjects, type Subject } from "../database/subject";
import {
  calculateGPA,
  getGPARecords,
  type GPARecord,
} from "../database/gpa";

const C = {
  navy: "#142D60",
  blue: "#3164D6",
  background: "#F5F7FC",
  white: "#FFFFFF",
  text: "#17233B",
  muted: "#718096",
  border: "#E6EBF3",
  green: "#218352",
};

type DashboardData = {
  cgpa: number | null;
  latestGPA: number | null;
  credits: number;
  semesterCount: number;
  subjectCount: number;
  recordedCourses: number;
  totalCourses: number;
};

const initialData: DashboardData = {
  cgpa: null,
  latestGPA: null,
  credits: 0,
  semesterCount: 0,
  subjectCount: 0,
  recordedCourses: 0,
  totalCourses: 0,
};

const actions = [
  {
    title: "ICA Calculator",
    subtitle: "Calculate your best 2 ICA marks",
    icon: Calculator,
    background: "#EAF1FF",
    route: "/ica" as const,
  },
  {
    title: "Final Exam Predictor",
    subtitle: "Calculate required final exam marks",
    icon: Target,
    background: "#F3ECFF",
    route: "/predictor" as const,
  },
  {
    title: "GPA & CGPA",
    subtitle: "Calculate your academic GPA",
    icon: GraduationCap,
    background: "#E8F8F1",
    route: "/gpa" as const,
  },
  {
    title: "Performance Analysis",
    subtitle: "Explore academic progress",
    icon: TrendingUp,
    background: "#FFF4E5",
    route: "/explore" as const,
  },
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const [semesters, subjects, records]: [
        Semester[],
        Subject[],
        GPARecord[],
      ] = await Promise.all([
        getSemesters(),
        getSubjects(),
        getGPARecords(),
      ]);

      const courseCredits = new Map<string, number>();

      for (const subject of subjects) {
        const key = `${subject.semester_id}:${subject.code
          .trim()
          .toUpperCase()}`;

        const previous = courseCredits.get(key) ?? 0;

        courseCredits.set(
          key,
          previous + Number(subject.credits),
        );
      }

      const calculatedRecords = records.map((record) => {
        const key = `${record.semester_id}:${record.course_code
          .trim()
          .toUpperCase()}`;

        const credits = courseCredits.get(key);

        return credits === undefined
          ? record
          : { ...record, credits };
      });

      const overall = calculateGPA(calculatedRecords);

      const recordedKeys = new Set(
        records.map(
          (record) =>
            `${record.semester_id}:${record.course_code
              .trim()
              .toUpperCase()}`,
        ),
      );

      const recordedCourses = [...recordedKeys].filter(
        (key) => courseCredits.has(key),
      ).length;

      const latestSemester = [...semesters].sort(
        (a, b) => b.id - a.id,
      )[0];

      const latestRecords = latestSemester
        ? calculatedRecords.filter(
            (record) =>
              record.semester_id === latestSemester.id,
          )
        : [];

      const latest = calculateGPA(latestRecords);

      setData({
        cgpa: overall.gpa,
        latestGPA: latest.gpa,
        credits: overall.credits,
        semesterCount: semesters.length,
        subjectCount: courseCredits.size,
        recordedCourses,
        totalCourses: courseCredits.size,
      });
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Unable to load academic information.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void loadDashboard();
  };

  const progress =
    data.totalCourses > 0
      ? Math.round(
          (data.recordedCourses / data.totalCourses) * 100,
        )
      : 0;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.blue} />
        <Text style={styles.loadingText}>
          Loading GradeScope...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.blue]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              Welcome back 👋
            </Text>

            <Text style={styles.heading}>
              GradeScope
            </Text>

            <Text style={styles.subheading}>
              Your academic journey, simplified.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <GraduationCap size={27} color={C.blue} />
          </View>
        </View>

        {error !== "" && (
          <Pressable
            style={styles.errorCard}
            onPress={() => void loadDashboard()}
          >
            <RefreshCw size={18} color="#C43C3C" />

            <Text style={styles.errorText}>
              {error} Tap to retry.
            </Text>
          </Pressable>
        )}

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>
                OVERALL CGPA
              </Text>

              <Text style={styles.heroValue}>
                {data.cgpa === null
                  ? "—"
                  : data.cgpa.toFixed(2)}

                <Text style={styles.heroMax}>
                  {" "}/ 4.00
                </Text>
              </Text>
            </View>

            <View style={styles.heroBadge}>
              <Sparkles size={17} color={C.white} />
            </View>
          </View>

          <Text style={styles.heroDescription}>
            {data.recordedCourses === 0
              ? "Add your course results to see your CGPA."
              : "Calculated from your saved academic results."}
          </Text>

          <View style={styles.heroDivider} />

          <View style={styles.heroBottom}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroSmallLabel}>
                Last Added Semester GPA
              </Text>

              <Text style={styles.heroSmallValue}>
                {data.latestGPA === null
                  ? "—"
                  : data.latestGPA.toFixed(2)}
              </Text>
            </View>

            <View style={styles.heroMetric}>
              <Text style={styles.heroSmallLabel}>
                Recorded Credits
              </Text>

              <Text style={styles.heroSmallValue}>
                {data.credits}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Academic Overview
          </Text>

          <ArrowUpRight size={19} color={C.blue} />
        </View>

        <View style={styles.statsRow}>
          <Pressable
            style={styles.statCard}
            onPress={() => router.push("/semesters")}
          >
            <View style={styles.statIcon}>
              <CalendarDays size={22} color={C.blue} />
            </View>

            <Text style={styles.statValue}>
              {data.semesterCount}
            </Text>

            <Text style={styles.statLabel}>
              Semesters
            </Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={() => router.push("/subjects")}
          >
            <View style={styles.statIcon}>
              <BookOpen size={22} color={C.blue} />
            </View>

            <Text style={styles.statValue}>
              {data.subjectCount}
            </Text>

            <Text style={styles.statLabel}>
              Unique Courses
            </Text>
          </Pressable>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressTitle}>
                Academic Results Progress
              </Text>

              <Text style={styles.progressSubtitle}>
                {data.recordedCourses} of {data.totalCourses} courses recorded
              </Text>
            </View>

            <Text style={styles.progressPercent}>
              {progress}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%` },
              ]}
            />
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/semesters")}
          style={({ pressed }) => [
            styles.manageCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.manageIcon}>
            <CalendarDays size={23} color={C.blue} />
          </View>

          <View style={styles.manageText}>
            <Text style={styles.manageTitle}>
              Manage Semesters
            </Text>

            <Text style={styles.manageSubtitle}>
              Add, edit and organize your semesters
            </Text>
          </View>

          <ChevronRight size={21} color={C.blue} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/subjects")}
          style={({ pressed }) => [
            styles.manageCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.manageIcon}>
            <BookOpen size={23} color={C.blue} />
          </View>

          <View style={styles.manageText}>
            <Text style={styles.manageTitle}>
              Manage Subjects
            </Text>

            <Text style={styles.manageSubtitle}>
              Add subjects, credits and assessment types
            </Text>
          </View>

          <ChevronRight size={21} color={C.blue} />
        </Pressable>

        <View style={styles.quickHeader}>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>
        </View>

        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Pressable
              key={action.title}
              onPress={() => router.push(action.route)}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.actionIcon,
                  {
                    backgroundColor: action.background,
                  },
                ]}
              >
                <Icon size={23} color={C.blue} />
              </View>

              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>
                  {action.title}
                </Text>

                <Text style={styles.actionSubtitle}>
                  {action.subtitle}
                </Text>
              </View>

              <ChevronRight
                size={20}
                color="#9AA7BB"
              />
            </Pressable>
          );
        })}

        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <Clock3 size={20} color={C.blue} />
          </View>

          <View style={styles.noteText}>
            <Text style={styles.noteTitle}>
              Your offline academic assistant
            </Text>

            <Text style={styles.noteDescription}>
              Academic records are saved locally on your device.
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Keep learning. Keep improving. 🎓
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  center: {
    flex: 1,
    backgroundColor: C.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: C.muted,
    fontSize: 13,
    marginTop: 13,
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
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F1",
    borderRadius: 12,
    padding: 13,
    gap: 10,
    marginBottom: 15,
  },
  errorText: {
    color: "#C43C3C",
    flex: 1,
    fontSize: 12,
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
    gap: 15,
  },
  heroMetric: {
    flex: 1,
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
  progressCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
  },
  progressSubtitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 6,
  },
  progressPercent: {
    color: C.blue,
    fontSize: 19,
    fontWeight: "800",
  },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: "#E7EDF7",
    overflow: "hidden",
    marginTop: 15,
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.blue,
    borderRadius: 6,
  },
  manageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#D8E3F7",
    marginBottom: 13,
  },
  manageIcon: {
    width: 51,
    height: 51,
    borderRadius: 15,
    backgroundColor: "#EAF1FF",
    justifyContent: "center",
    alignItems: "center",
  },
  manageText: {
    flex: 1,
    marginLeft: 13,
  },
  manageTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },
  manageSubtitle: {
    fontSize: 11,
    color: C.muted,
    marginTop: 5,
  },
  quickHeader: {
    marginTop: 18,
    marginBottom: 15,
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
  noteText: {
    flex: 1,
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
    lineHeight: 17,
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
