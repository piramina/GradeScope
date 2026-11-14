
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  GraduationCap,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";

import {
  calculateGPA,
  getGPARecords,
  type GPARecord,
} from "../database/gpa";
import {
  getSemesters,
  type Semester,
} from "../database/semester";
import {
  getSubjects,
  type Subject,
} from "../database/subject";

const C = {
  navy: "#142D60",
  blue: "#3164D6",
  bg: "#F5F7FC",
  white: "#FFFFFF",
  text: "#17233B",
  muted: "#718096",
  border: "#E6EBF3",
  lightBlue: "#EAF1FF",
  green: "#218352",
  red: "#DC3545",
  orange: "#D18B26",
};

type Course = {
  key: string;
  semesterId: number;
  code: string;
  name: string;
  credits: number;
};

type SemesterPerformance = {
  id: number;
  name: string;
  academicYear: string;
  gpa: number | null;
  totalCourses: number;
  completedCourses: number;
  pendingCourses: number;
  recordedCredits: number;
  totalCredits: number;
  progress: number;
};

export default function PerformanceAnalysisScreen() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<GPARecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSemester, setExpandedSemester] = useState<number | null>(
    null,
  );

  const loadData = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      }

      const [semesterRows, subjectRows, recordRows] =
        await Promise.all([
          getSemesters(),
          getSubjects(),
          getGPARecords(),
        ]);

      setSemesters(semesterRows);
      setSubjects(subjectRows);
      setRecords(recordRows);
    } catch (error) {
      console.error("Performance analysis loading error:", error);
      Alert.alert(
        "Loading Error",
        "Unable to load academic performance data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const courses = useMemo(() => {
    const courseMap = new Map<string, Course>();

    for (const subject of subjects) {
      const code = subject.code.trim().toUpperCase();
      const key = `${subject.semester_id}:${code}`;
      const credit = Number(subject.credits);

      const existing = courseMap.get(key);

      if (existing) {
        existing.credits += credit;
      } else {
        courseMap.set(key, {
          key,
          semesterId: subject.semester_id,
          code,
          name: subject.name,
          credits: credit,
        });
      }
    }

    return [...courseMap.values()];
  }, [subjects]);

  const recordMap = useMemo(() => {
    const map = new Map<string, GPARecord>();

    for (const record of records) {
      const key = `${record.semester_id}:${record.course_code
        .trim()
        .toUpperCase()}`;

      map.set(key, record);
    }

    return map;
  }, [records]);

  const calculatedRecords = useMemo(() => {
    const courseMap = new Map(
      courses.map((course) => [course.key, course]),
    );

    return records.map((record) => {
      const key = `${record.semester_id}:${record.course_code
        .trim()
        .toUpperCase()}`;

      const course = courseMap.get(key);

      if (!course) {
        return record;
      }

      return {
        ...record,
        credits: course.credits,
      };
    });
  }, [courses, records]);

  const overallSummary = useMemo(() => {
    return calculateGPA(calculatedRecords);
  }, [calculatedRecords]);

  const semesterPerformance = useMemo<SemesterPerformance[]>(() => {
    return semesters.map((semester) => {
      const semesterCourses = courses.filter(
        (course) => course.semesterId === semester.id,
      );

      const semesterRecords = calculatedRecords.filter(
        (record) => record.semester_id === semester.id,
      );

      const summary = calculateGPA(semesterRecords);

      const completedCourses = semesterCourses.filter(
        (course) => recordMap.has(course.key),
      ).length;

      const totalCourses = semesterCourses.length;

      const pendingCourses = totalCourses - completedCourses;

      const totalCredits = semesterCourses.reduce(
        (sum, course) => sum + course.credits,
        0,
      );

      const progress =
        totalCourses > 0
          ? Math.round((completedCourses / totalCourses) * 100)
          : 0;

      return {
        id: semester.id,
        name: semester.name,
        academicYear: String(semester.academic_year ?? ""),
        gpa: summary.gpa,
        totalCourses,
        completedCourses,
        pendingCourses,
        recordedCredits: summary.credits,
        totalCredits,
        progress,
      };
    });
  }, [semesters, courses, calculatedRecords, recordMap]);

  const totalCourses = courses.length;

  const completedCourses = courses.filter(
    (course) => recordMap.has(course.key),
  ).length;

  const pendingCourses = totalCourses - completedCourses;

  const overallProgress =
    totalCourses > 0
      ? Math.round((completedCourses / totalCourses) * 100)
      : 0;

  const completedSemesters = semesterPerformance.filter(
    (semester) =>
      semester.totalCourses > 0 && semester.pendingCourses === 0,
  ).length;

  const semestersWithGPA = semesterPerformance.filter(
    (semester) => semester.gpa !== null,
  );

  const bestSemester =
    semestersWithGPA.length > 0
      ? semestersWithGPA.reduce((best, semester) => {
          if (
            semester.gpa !== null &&
            (best.gpa === null || semester.gpa > best.gpa)
          ) {
            return semester;
          }

          return best;
        })
      : null;

  const getPerformanceLabel = (gpa: number | null) => {
    if (gpa === null) {
      return "No grades recorded";
    }

    if (gpa >= 3.7) {
      return "Excellent Performance";
    }

    if (gpa >= 3.3) {
      return "Very Good Performance";
    }

    if (gpa >= 3.0) {
      return "Good Performance";
    }

    if (gpa >= 2.0) {
      return "Developing Performance";
    }

    return "Needs Improvement";
  };

  const insights = useMemo(() => {
    const messages: {
      title: string;
      description: string;
      type: "success" | "warning" | "info";
    }[] = [];

    if (totalCourses === 0) {
      messages.push({
        title: "Start Your Academic Journey",
        description:
          "Add semesters and subjects to begin tracking your academic performance.",
        type: "info",
      });

      return messages;
    }

    if (completedCourses === 0) {
      messages.push({
        title: "Record Your First Result",
        description:
          "Your subjects are ready. Save your course grades in the GPA Calculator to unlock performance analysis.",
        type: "info",
      });

      return messages;
    }

    if (overallSummary.gpa !== null) {
      if (overallSummary.gpa >= 3.7) {
        messages.push({
          title: "Excellent Academic Progress",
          description:
            "Your recorded CGPA is in a strong range. Keep maintaining consistent results.",
          type: "success",
        });
      } else if (overallSummary.gpa >= 3.0) {
        messages.push({
          title: "Good Academic Progress",
          description:
            "Your recorded CGPA shows good progress. Focus on consistency across your remaining courses.",
          type: "success",
        });
      } else {
        messages.push({
          title: "Opportunity to Improve",
          description:
            "Review your lower grades and plan your upcoming course preparation carefully.",
          type: "warning",
        });
      }
    }

    if (pendingCourses > 0) {
      messages.push({
        title: `${pendingCourses} Course Results Pending`,
        description:
          "Record your remaining course grades to make your academic progress analysis more complete.",
        type: "info",
      });
    } else {
      messages.push({
        title: "All Course Results Recorded",
        description:
          "All currently registered courses have saved results. Your course tracking is complete.",
        type: "success",
      });
    }

    if (bestSemester && semestersWithGPA.length > 1) {
      messages.push({
        title: "Your Strongest Semester",
        description: `${bestSemester.name} has your highest recorded semester GPA of ${bestSemester.gpa?.toFixed(2)}.`,
        type: "success",
      });
    }

    return messages;
  }, [
    totalCourses,
    completedCourses,
    pendingCourses,
    overallSummary.gpa,
    bestSemester,
    semestersWithGPA.length,
  ]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.blue} />
        <Text style={styles.loadingText}>
          Analyzing academic performance...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>
        ACADEMIC INTELLIGENCE
      </Text>

      <Text style={styles.heading}>
        Performance Analysis
      </Text>

      <Text style={styles.subtitle}>
        Understand your GPA, academic progress and semester performance
        using your saved results.
      </Text>

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <GraduationCap size={25} color={C.white} />
          </View>

          <View style={styles.heroTag}>
            <Text style={styles.heroTagText}>
              OFFLINE ANALYSIS
            </Text>
          </View>
        </View>

        <Text style={styles.heroLabel}>
          CURRENT OVERALL CGPA
        </Text>

        <Text style={styles.heroGpa}>
          {overallSummary.gpa === null
            ? "—"
            : overallSummary.gpa.toFixed(2)}

          <Text style={styles.heroGpaMax}>
            {" "}/ 4.00
          </Text>
        </Text>

        <Text style={styles.heroPerformance}>
          {getPerformanceLabel(overallSummary.gpa)}
        </Text>

        <View style={styles.heroDivider} />

        <View style={styles.heroStatsRow}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>
              {overallSummary.credits}
            </Text>
            <Text style={styles.heroStatLabel}>
              Recorded Credits
            </Text>
          </View>

          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>
              {overallSummary.courses}
            </Text>
            <Text style={styles.heroStatLabel}>
              GPA Records
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>01</Text>
        </View>

        <BarChart3 size={20} color={C.blue} />

        <Text style={styles.sectionTitle}>
          Academic Overview
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <BookOpen size={20} color={C.blue} />
          </View>

          <Text style={styles.statValue}>
            {totalCourses}
          </Text>

          <Text style={styles.statLabel}>
            Total Courses
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, styles.greenIcon]}>
            <CheckCircle2 size={20} color={C.green} />
          </View>

          <Text style={styles.statValue}>
            {completedCourses}
          </Text>

          <Text style={styles.statLabel}>
            Saved Results
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, styles.orangeIcon]}>
            <Clock3 size={20} color={C.orange} />
          </View>

          <Text style={styles.statValue}>
            {pendingCourses}
          </Text>

          <Text style={styles.statLabel}>
            Pending Results
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <GraduationCap size={20} color={C.blue} />
          </View>

          <Text style={styles.statValue}>
            {completedSemesters}
          </Text>

          <Text style={styles.statLabel}>
            Complete Semesters
          </Text>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressTitle}>
              Overall Course Progress
            </Text>

            <Text style={styles.progressSubtitle}>
              {completedCourses} of {totalCourses} courses recorded
            </Text>
          </View>

          <Text style={styles.progressPercent}>
            {overallProgress}%
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${overallProgress}%` },
            ]}
          />
        </View>

        <View style={styles.progressFooter}>
          <Text style={styles.progressFooterText}>
            Saved
          </Text>

          <Text style={styles.progressFooterText}>
            Pending: {pendingCourses}
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>02</Text>
        </View>

        <Award size={20} color={C.blue} />

        <Text style={styles.sectionTitle}>
          Best Performing Semester
        </Text>
      </View>

      {bestSemester ? (
        <View style={styles.bestCard}>
          <View style={styles.bestIcon}>
            <Award size={28} color={C.blue} />
          </View>

          <View style={styles.bestInfo}>
            <Text style={styles.bestLabel}>
              HIGHEST RECORDED GPA
            </Text>

            <Text style={styles.bestName}>
              {bestSemester.name}
            </Text>

            <Text style={styles.bestYear}>
              {bestSemester.academicYear}
            </Text>
          </View>

          <View style={styles.bestGpaWrap}>
            <Text style={styles.bestGpa}>
              {bestSemester.gpa?.toFixed(2)}
            </Text>

            <Text style={styles.bestGpaCaption}>
              GPA
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Award size={30} color="#A7B8D7" />

          <Text style={styles.emptyTitle}>
            No GPA Results Yet
          </Text>

          <Text style={styles.emptyText}>
            Save course grades to discover your strongest semester.
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>03</Text>
        </View>

        <TrendingUp size={20} color={C.blue} />

        <Text style={styles.sectionTitle}>
          Semester Performance
        </Text>
      </View>

      {semesterPerformance.length === 0 ? (
        <View style={styles.emptyCard}>
          <GraduationCap size={30} color="#A7B8D7" />

          <Text style={styles.emptyTitle}>
            No Semesters Found
          </Text>

          <Text style={styles.emptyText}>
            Add a semester to start tracking your performance.
          </Text>
        </View>
      ) : (
        semesterPerformance.map((semester) => {
          const expanded = expandedSemester === semester.id;

          return (
            <View
              key={semester.id}
              style={styles.semesterCard}
            >
              <Pressable
                style={styles.semesterHeader}
                onPress={() =>
                  setExpandedSemester(
                    expanded ? null : semester.id,
                  )
                }
              >
                <View style={styles.semesterIcon}>
                  <GraduationCap size={20} color={C.blue} />
                </View>

                <View style={styles.semesterInfo}>
                  <Text style={styles.semesterName}>
                    {semester.name}
                  </Text>

                  <Text style={styles.semesterYear}>
                    {semester.academicYear}
                  </Text>
                </View>

                <View style={styles.semesterGpaBox}>
                  <Text style={styles.semesterGpaValue}>
                    {semester.gpa === null
                      ? "—"
                      : semester.gpa.toFixed(2)}
                  </Text>

                  <Text style={styles.semesterGpaLabel}>
                    GPA
                  </Text>
                </View>

                {expanded ? (
                  <ChevronUp size={19} color={C.blue} />
                ) : (
                  <ChevronDown size={19} color={C.muted} />
                )}
              </Pressable>

              <View style={styles.semesterProgressArea}>
                <View style={styles.semesterProgressRow}>
                  <Text style={styles.semesterProgressLabel}>
                    Course Completion
                  </Text>

                  <Text style={styles.semesterProgressPercent}>
                    {semester.progress}%
                  </Text>
                </View>

                <View style={styles.smallProgressTrack}>
                  <View
                    style={[
                      styles.smallProgressFill,
                      { width: `${semester.progress}%` },
                    ]}
                  />
                </View>
              </View>

              {expanded && (
                <View style={styles.semesterDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Total Courses
                    </Text>

                    <Text style={styles.detailValue}>
                      {semester.totalCourses}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Saved Results
                    </Text>

                    <Text style={styles.detailValue}>
                      {semester.completedCourses}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Pending Results
                    </Text>

                    <Text style={styles.detailValue}>
                      {semester.pendingCourses}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Total Course Credits
                    </Text>

                    <Text style={styles.detailValue}>
                      {semester.totalCredits}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Recorded Credits
                    </Text>

                    <Text style={styles.detailValue}>
                      {semester.recordedCredits}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      Performance
                    </Text>

                    <Text style={styles.detailValue}>
                      {getPerformanceLabel(semester.gpa)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}

      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>04</Text>
        </View>

        <Lightbulb size={20} color={C.blue} />

        <Text style={styles.sectionTitle}>
          Academic Insights
        </Text>
      </View>

      <View style={styles.insightsCard}>
        {insights.map((insight, index) => (
          <View
            key={`${insight.title}-${index}`}
            style={[
              styles.insightRow,
              index < insights.length - 1 &&
                styles.insightBorder,
            ]}
          >
            <View
              style={[
                styles.insightIcon,
                insight.type === "success"
                  ? styles.greenIcon
                  : insight.type === "warning"
                    ? styles.orangeIcon
                    : styles.blueIcon,
              ]}
            >
              {insight.type === "success" ? (
                <CheckCircle2 size={20} color={C.green} />
              ) : insight.type === "warning" ? (
                <Target size={20} color={C.orange} />
              ) : (
                <Lightbulb size={20} color={C.blue} />
              )}
            </View>

            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>
                {insight.title}
              </Text>

              <Text style={styles.insightDescription}>
                {insight.description}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        style={[
          styles.refreshButton,
          refreshing && styles.disabled,
        ]}
        onPress={() => void loadData(true)}
        disabled={refreshing}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color={C.white} />
        ) : (
          <BarChart3 size={18} color={C.white} />
        )}

        <Text style={styles.refreshButtonText}>
          {refreshing ? "Refreshing..." : "Refresh Analysis"}
        </Text>
      </Pressable>

      <View style={styles.notice}>
        <Lightbulb size={19} color={C.blue} />

        <Text style={styles.noticeText}>
          Performance analysis uses your locally saved
          semesters, subjects and GPA results. Grades
          are weighted by course credits. Academic
          performance labels are general indicators,
          not official university classifications.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 65,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: C.muted,
    fontSize: 13,
    marginTop: 14,
  },
  eyebrow: {
    color: C.blue,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 7,
  },
  heading: {
    color: C.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 23,
  },
  hero: {
    backgroundColor: C.navy,
    padding: 23,
    borderRadius: 23,
    marginBottom: 28,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 21,
  },
  heroIcon: {
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2E4B83",
    borderRadius: 14,
  },
  heroTag: {
    backgroundColor: "#2E4B83",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  heroTagText: {
    color: "#D7E5FF",
    fontSize: 10,
    fontWeight: "800",
  },
  heroLabel: {
    color: "#D5E0FA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroGpa: {
    color: C.white,
    fontSize: 46,
    fontWeight: "800",
    marginTop: 8,
  },
  heroGpaMax: {
    color: "#BFCFEF",
    fontSize: 17,
  },
  heroPerformance: {
    color: "#D5E0FA",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "#365287",
    marginTop: 23,
    marginBottom: 18,
  },
  heroStatsRow: {
    flexDirection: "row",
  },
  heroStat: {
    flex: 1,
    gap: 6,
  },
  heroStatValue: {
    color: C.white,
    fontSize: 21,
    fontWeight: "800",
  },
  heroStatLabel: {
    color: "#C8D7F4",
    fontSize: 11,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 15,
  },
  sectionNumber: {
    width: 30,
    height: 30,
    backgroundColor: "#DFEAFD",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionNumberText: {
    color: C.blue,
    fontSize: 11,
    fontWeight: "800",
  },
  sectionTitle: {
    flex: 1,
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 17,
    gap: 9,
  },
  statIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: C.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  greenIcon: {
    backgroundColor: "#E7F7EE",
  },
  orangeIcon: {
    backgroundColor: "#FFF4E5",
  },
  blueIcon: {
    backgroundColor: C.lightBlue,
  },
  statValue: {
    color: C.navy,
    fontSize: 26,
    fontWeight: "800",
  },
  statLabel: {
    color: C.muted,
    fontSize: 11,
  },
  progressCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 18,
    marginBottom: 28,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    fontSize: 20,
    fontWeight: "800",
  },
  progressTrack: {
    height: 9,
    backgroundColor: "#E7EDF7",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 18,
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.blue,
    borderRadius: 6,
  },
  progressFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  progressFooterText: {
    color: C.muted,
    fontSize: 11,
  },
  bestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: "#BBD0F6",
    borderRadius: 17,
    padding: 17,
    gap: 12,
    marginBottom: 29,
  },
  bestIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: C.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  bestInfo: {
    flex: 1,
    gap: 5,
  },
  bestLabel: {
    fontSize: 10,
    color: C.blue,
    fontWeight: "800",
  },
  bestName: {
    color: C.navy,
    fontSize: 16,
    fontWeight: "800",
  },
  bestYear: {
    color: C.muted,
    fontSize: 11,
  },
  bestGpaWrap: {
    alignItems: "center",
    gap: 3,
  },
  bestGpa: {
    color: C.blue,
    fontSize: 25,
    fontWeight: "800",
  },
  bestGpaCaption: {
    color: C.muted,
    fontSize: 10,
  },
  emptyCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 24,
    alignItems: "center",
    gap: 11,
    marginBottom: 28,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  semesterCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    marginBottom: 13,
    overflow: "hidden",
  },
  semesterHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    gap: 10,
  },
  semesterIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  semesterInfo: {
    flex: 1,
    gap: 4,
  },
  semesterName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
  },
  semesterYear: {
    color: C.muted,
    fontSize: 11,
  },
  semesterGpaBox: {
    alignItems: "center",
    gap: 3,
  },
  semesterGpaValue: {
    color: C.blue,
    fontSize: 20,
    fontWeight: "800",
  },
  semesterGpaLabel: {
    color: C.muted,
    fontSize: 10,
  },
  semesterProgressArea: {
    paddingHorizontal: 16,
    paddingBottom: 15,
  },
  semesterProgressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  semesterProgressLabel: {
    color: C.muted,
    fontSize: 11,
  },
  semesterProgressPercent: {
    color: C.blue,
    fontSize: 11,
    fontWeight: "800",
  },
  smallProgressTrack: {
    height: 7,
    borderRadius: 5,
    backgroundColor: "#E7EDF7",
    overflow: "hidden",
  },
  smallProgressFill: {
    height: "100%",
    backgroundColor: C.blue,
    borderRadius: 5,
  },
  semesterDetails: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    padding: 16,
    gap: 15,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  detailLabel: {
    color: C.muted,
    fontSize: 12,
    flexShrink: 1,
  },
  detailValue: {
    color: C.navy,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
    flexShrink: 1,
  },
  insightsCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    paddingHorizontal: 17,
    marginBottom: 20,
  },
  insightRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 18,
  },
  insightBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  insightIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  insightContent: {
    flex: 1,
    gap: 6,
  },
  insightTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: "800",
  },
  insightDescription: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  refreshButton: {
    backgroundColor: C.blue,
    borderRadius: 13,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginBottom: 20,
  },
  refreshButtonText: {
    color: C.white,
    fontSize: 13,
    fontWeight: "800",
  },
  notice: {
    flexDirection: "row",
    gap: 11,
    backgroundColor: C.lightBlue,
    borderRadius: 15,
    padding: 16,
  },
  noticeText: {
    flex: 1,
    color: "#607394",
    fontSize: 11,
    lineHeight: 19,
  },
  disabled: {
    opacity: 0.6,
  },
});
