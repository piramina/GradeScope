
import { router, useFocusEffect } from "expo-router";
import {
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Filter,
  GraduationCap,
  Info,
  PlusCircle,
  Save,
  Trash2,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  calculateGPA,
  deleteGPARecord,
  getGPARecords,
  getGradePoint,
  GRADES,
  saveGPARecord,
  type GPARecord,
  type Grade,
} from "../database/gpa";
import { getSemesters, type Semester } from "../database/semester";
import { getSubjects, type Subject } from "../database/subject";

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
};

type FilterType = "All" | "Saved" | "Pending";

type Course = {
  key: string;
  semester_id: number;
  code: string;
  name: string;
  credits: number;
  theoryCredits: number;
  practicalCredits: number;
  types: string[];
};

export default function GPAScreen() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<GPARecord[]>([]);
  const [semesterId, setSemesterId] = useState<number | null>(null);

  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);
  const [filter, setFilter] = useState<FilterType>("All");
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [showGradeOptions, setShowGradeOptions] = useState(false);
  const [gradeInputs, setGradeInputs] = useState<Record<string, Grade>>({});

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [semesterRows, subjectRows, gradeRows] = await Promise.all([
        getSemesters(),
        getSubjects(),
        getGPARecords(),
      ]);

      setSemesters(semesterRows);
      setSubjects(subjectRows);
      setRecords(gradeRows);

      setSemesterId((current) => {
        if (
          current !== null &&
          semesterRows.some((semester) => semester.id === current)
        ) {
          return current;
        }

        return semesterRows[0]?.id ?? null;
      });
    } catch (error) {
      console.error("GPA load error:", error);
      Alert.alert("Loading Error", "Unable to load academic results.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const courses = useMemo(() => {
    const map = new Map<string, Course>();

    for (const subject of subjects) {
      const code = subject.code.trim().toUpperCase();
      const key = `${subject.semester_id}:${code}`;
      const credit = Number(subject.credits);

      const existing = map.get(key);

      if (existing) {
        existing.credits += credit;

        if (subject.type === "Theory") {
          existing.theoryCredits += credit;
        }

        if (subject.type === "Practical") {
          existing.practicalCredits += credit;
        }

        if (!existing.types.includes(subject.type)) {
          existing.types.push(subject.type);
        }
      } else {
        map.set(key, {
          key,
          semester_id: subject.semester_id,
          code,
          name: subject.name,
          credits: credit,
          theoryCredits: subject.type === "Theory" ? credit : 0,
          practicalCredits: subject.type === "Practical" ? credit : 0,
          types: [subject.type],
        });
      }
    }

    return [...map.values()].sort((a, b) =>
      a.code.localeCompare(b.code),
    );
  }, [subjects]);

  const selectedSemester = semesters.find(
    (semester) => semester.id === semesterId,
  );

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

  const findRecord = (course: Course) => {
    return recordMap.get(course.key);
  };

  const selectedCourses = courses.filter(
    (course) => course.semester_id === semesterId,
  );

  const filteredCourses = selectedCourses.filter((course) => {
    const saved = recordMap.has(course.key);

    return (
      filter === "All" ||
      (filter === "Saved" && saved) ||
      (filter === "Pending" && !saved)
    );
  });

  const savedCount = selectedCourses.filter((course) =>
    recordMap.has(course.key),
  ).length;

  const pendingCount = selectedCourses.length - savedCount;

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
  }, [records, courses]);

  const semesterRecords = calculatedRecords.filter(
    (record) => record.semester_id === semesterId,
  );

  const semesterSummary = calculateGPA(semesterRecords);
  const overallSummary = calculateGPA(calculatedRecords);

  const selectSemester = (id: number) => {
    setSemesterId(id);
    setShowSemesterDropdown(false);
    setExpandedCourse(null);
    setShowGradeOptions(false);
    setFilter("All");
    Keyboard.dismiss();
  };

  const toggleCourse = (key: string) => {
    setExpandedCourse((current) => (current === key ? null : key));
    setShowGradeOptions(false);
    Keyboard.dismiss();
  };

  const save = async (course: Course) => {
    if (savingKey !== null || deletingKey !== null) {
      return;
    }

    const existing = findRecord(course);
    const selectedGrade =
      gradeInputs[course.key] ?? existing?.grade;

    if (!selectedGrade) {
      Alert.alert(
        "Select Grade",
        "Please select your result grade.",
      );
      return;
    }

    if (
      !Number.isFinite(course.credits) ||
      course.credits <= 0
    ) {
      Alert.alert(
        "Invalid Credits",
        "Please check your subject credits in Subject Management.",
      );
      return;
    }

    try {
      setSavingKey(course.key);

      await saveGPARecord(
        course.semester_id,
        course.code,
        course.credits,
        selectedGrade,
      );

      setGradeInputs((old) => {
        const next = { ...old };
        delete next[course.key];
        return next;
      });

      await load();

      setExpandedCourse(null);
      setShowGradeOptions(false);
      Keyboard.dismiss();

      Alert.alert(
        "Result Saved",
        `${course.code}: ${selectedGrade} (${getGradePoint(
          selectedGrade,
        ).toFixed(1)} points)`,
      );
    } catch (error) {
      console.error("GPA save error:", error);
      Alert.alert("Save Failed", "Unable to save this result.");
    } finally {
      setSavingKey(null);
    }
  };

  const remove = (course: Course) => {
    const existing = findRecord(course);

    if (!existing || deletingKey !== null || savingKey !== null) {
      return;
    }

    Alert.alert(
      "Remove Result",
      `Remove the saved result for ${course.code}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingKey(course.key);
              await deleteGPARecord(existing.id);

              setGradeInputs((old) => {
                const next = { ...old };
                delete next[course.key];
                return next;
              });

              await load();

              setExpandedCourse(null);
              setShowGradeOptions(false);
            } catch (error) {
              console.error("GPA delete error:", error);
              Alert.alert(
                "Delete Failed",
                "Unable to delete this result.",
              );
            } finally {
              setDeletingKey(null);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.blue} />
        <Text style={styles.loadingText}>
          Loading academic results...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>
        ACADEMIC PERFORMANCE
      </Text>

      <Text style={styles.heading}>GPA & CGPA</Text>

      <Text style={styles.subtitle}>
        Select your semester and record your course result grades.
        Theory and Practical credits are combined automatically.
      </Text>

      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <GraduationCap size={28} color="#CFE0FF" />
          <Text style={styles.heroTag}>LIVE RESULTS</Text>
        </View>

        <Text style={styles.heroLabel}>OVERALL CGPA</Text>

        <Text style={styles.heroValue}>
          {overallSummary.gpa === null
            ? "—"
            : overallSummary.gpa.toFixed(2)}
          <Text style={styles.heroMax}> / 4.00</Text>
        </Text>

        <Text style={styles.heroCaption}>
          {overallSummary.credits} Recorded Credits
          {"  •  "}
          {overallSummary.courses} Courses
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber}>
          <Text style={styles.sectionNumberText}>01</Text>
        </View>

        <CalendarDays size={20} color={C.blue} />

        <Text style={styles.sectionTitle}>
          Choose Semester
        </Text>
      </View>

      {semesters.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.muted}>
            No semesters available.
          </Text>

          <Pressable
            style={styles.linkButton}
            onPress={() => router.push("/semesters")}
          >
            <PlusCircle size={18} color={C.blue} />
            <Text style={styles.linkText}>
              Add Semester
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Pressable
            onPress={() =>
              setShowSemesterDropdown((current) => !current)
            }
            style={styles.semesterDropdown}
          >
            <View style={styles.semesterDropdownIcon}>
              <CalendarDays size={22} color={C.blue} />
            </View>

            <View style={styles.semesterDropdownInfo}>
              <Text style={styles.dropdownLabel}>
                SELECTED SEMESTER
              </Text>

              <Text style={styles.dropdownValue}>
                {selectedSemester?.name ?? "Select Semester"}
              </Text>

              <Text style={styles.dropdownYear}>
                {selectedSemester?.academic_year}
              </Text>
            </View>

            {showSemesterDropdown ? (
              <ChevronUp size={21} color={C.blue} />
            ) : (
              <ChevronDown size={21} color={C.blue} />
            )}
          </Pressable>

          {showSemesterDropdown && (
            <View style={styles.dropdownOptions}>
              {semesters.map((semester) => (
                <Pressable
                  key={semester.id}
                  onPress={() => selectSemester(semester.id)}
                  style={[
                    styles.dropdownOption,
                    semesterId === semester.id &&
                      styles.activeOption,
                  ]}
                >
                  <View style={styles.semesterDropdownInfo}>
                    <Text style={styles.optionTitle}>
                      {semester.name}
                    </Text>

                    <Text style={styles.optionSubtitle}>
                      {semester.academic_year}
                    </Text>
                  </View>

                  {semesterId === semester.id && (
                    <Check size={19} color={C.blue} />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                SEMESTER GPA
              </Text>

              <Text style={styles.summaryValue}>
                {semesterSummary.gpa === null
                  ? "—"
                  : semesterSummary.gpa.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>
                RECORDED CREDITS
              </Text>

              <Text style={styles.summaryValue}>
                {semesterSummary.credits}
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
              <Text style={styles.sectionNumberText}>02</Text>
            </View>

            <BookOpen size={20} color={C.blue} />

            <Text style={styles.sectionTitle}>
              Course Results
            </Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressTitle}>
                  Results Progress
                </Text>

                <Text style={styles.progressSubtitle}>
                  {savedCount} of {selectedCourses.length} courses recorded
                </Text>
              </View>

              <Text style={styles.progressPercent}>
                {selectedCourses.length > 0
                  ? Math.round(
                      (savedCount / selectedCourses.length) * 100,
                    )
                  : 0}
                %
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      selectedCourses.length > 0
                        ? (savedCount / selectedCourses.length) * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.filterHeader}>
            <Filter size={16} color={C.muted} />

            <Text style={styles.filterTitle}>
              Filter Courses
            </Text>
          </View>

          <View style={styles.filterRow}>
            {(["All", "Saved", "Pending"] as FilterType[]).map(
              (option) => {
                const count =
                  option === "All"
                    ? selectedCourses.length
                    : option === "Saved"
                      ? savedCount
                      : pendingCount;

                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setFilter(option);
                      setExpandedCourse(null);
                      setShowGradeOptions(false);
                    }}
                    style={[
                      styles.filterButton,
                      filter === option &&
                        styles.filterButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        filter === option &&
                          styles.filterTextActive,
                      ]}
                    >
                      {option} ({count})
                    </Text>
                  </Pressable>
                );
              },
            )}
          </View>

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsLabel}>
              {filteredCourses.length} courses
            </Text>

            <Text style={styles.resultsHint}>
              Tap a course to edit
            </Text>
          </View>

          {selectedCourses.length === 0 ? (
            <View style={styles.emptyCard}>
              <BookOpen size={34} color="#A7B8D7" />

              <Text style={styles.emptyTitle}>
                No courses in this semester
              </Text>

              <Text style={styles.emptyText}>
                Add a subject to start recording grades.
              </Text>

              <Pressable
                style={styles.linkButton}
                onPress={() => router.push("/subjects")}
              >
                <PlusCircle size={18} color={C.blue} />

                <Text style={styles.linkText}>
                  Manage Subjects
                </Text>
              </Pressable>
            </View>
          ) : filteredCourses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Filter size={32} color="#A7B8D7" />

              <Text style={styles.emptyTitle}>
                No courses in this filter
              </Text>

              <Text style={styles.emptyText}>
                Select All to view every course.
              </Text>

              <Pressable
                onPress={() => setFilter("All")}
                style={styles.linkButton}
              >
                <Text style={styles.linkText}>
                  Show All Courses
                </Text>
              </Pressable>
            </View>
          ) : (
            filteredCourses.map((course) => {
              const existing = findRecord(course);
              const isExpanded = expandedCourse === course.key;

              const selectedGrade =
                gradeInputs[course.key] ??
                existing?.grade ??
                null;

              return (
                <View
                  key={course.key}
                  style={[
                    styles.courseCard,
                    isExpanded && styles.courseCardExpanded,
                  ]}
                >
                  <Pressable
                    onPress={() => toggleCourse(course.key)}
                    style={styles.courseHeader}
                  >
                    <View style={styles.courseIcon}>
                      <BookOpen size={21} color={C.blue} />
                    </View>

                    <View style={styles.courseInfo}>
                      <Text style={styles.courseName}>
                        {course.name}
                      </Text>

                      <Text style={styles.courseCode}>
                        {course.code}
                      </Text>

                      <Text style={styles.courseTypes}>
                        {course.types.join(" + ")}
                      </Text>
                    </View>

                    <View style={styles.courseRight}>
                      {existing ? (
                        <View style={styles.savedBadge}>
                          <CheckCircle2 size={13} color={C.green} />

                          <Text style={styles.savedText}>
                            {existing.grade ?? "Saved"}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Clock3 size={13} color="#A46A1C" />

                          <Text style={styles.pendingText}>
                            Pending
                          </Text>
                        </View>
                      )}

                      {isExpanded ? (
                        <ChevronUp size={20} color={C.blue} />
                      ) : (
                        <ChevronDown size={20} color={C.muted} />
                      )}
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={styles.divider} />

                      {course.types.length > 1 && (
                        <View style={styles.infoBox}>
                          <Info size={17} color={C.blue} />

                          <Text style={styles.infoText}>
                            Theory and Practical are grouped
                            as one course. Select one combined
                            course grade.
                          </Text>
                        </View>
                      )}

                      <Text style={styles.label}>
                        Course Credit Breakdown
                      </Text>

                      <View style={styles.creditBreakdown}>
                        {course.types.includes("Theory") && (
                          <View style={styles.creditRow}>
                            <Text style={styles.creditRowLabel}>
                              Theory Credits
                            </Text>

                            <Text style={styles.creditRowValue}>
                              {course.theoryCredits}
                            </Text>
                          </View>
                        )}

                        {course.types.includes("Practical") && (
                          <View style={styles.creditRow}>
                            <Text style={styles.creditRowLabel}>
                              Practical Credits
                            </Text>

                            <Text style={styles.creditRowValue}>
                              {course.practicalCredits}
                            </Text>
                          </View>
                        )}

                        <View style={styles.creditTotalRow}>
                          <Text style={styles.creditTotalLabel}>
                            Total Credits
                          </Text>

                          <Text style={styles.creditTotalValue}>
                            {course.credits}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.autoCreditNotice}>
                        <CheckCircle2 size={15} color={C.green} />

                        <Text style={styles.autoCreditText}>
                          Credits calculated automatically
                        </Text>
                      </View>

                      <Text style={styles.label}>
                        Your Result Grade
                      </Text>

                      <Pressable
                        style={styles.gradeSelector}
                        onPress={() =>
                          setShowGradeOptions((current) => !current)
                        }
                      >
                        <View style={styles.gradeSelectorInfo}>
                          <Text style={styles.gradeSelected}>
                            {selectedGrade ?? "Select Grade"}
                          </Text>

                          <Text style={styles.gradeHint}>
                            {selectedGrade
                              ? `${getGradePoint(
                                  selectedGrade,
                                ).toFixed(1)} grade points`
                              : "Choose A+, A, A-, B+ ... E"}
                          </Text>
                        </View>

                        {showGradeOptions ? (
                          <ChevronUp size={20} color={C.blue} />
                        ) : (
                          <ChevronDown size={20} color={C.blue} />
                        )}
                      </Pressable>

                      {showGradeOptions && (
                        <View style={styles.gradeGrid}>
                          {GRADES.map((grade) => (
                            <Pressable
                              key={grade}
                              onPress={() => {
                                setGradeInputs((old) => ({
                                  ...old,
                                  [course.key]: grade,
                                }));

                                setShowGradeOptions(false);
                              }}
                              style={[
                                styles.gradeOption,
                                selectedGrade === grade &&
                                  styles.gradeOptionActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.gradeOptionText,
                                  selectedGrade === grade &&
                                    styles.gradeOptionTextActive,
                                ]}
                              >
                                {grade}
                              </Text>

                              <Text style={styles.gradePointText}>
                                {getGradePoint(grade).toFixed(1)}
                              </Text>

                              {selectedGrade === grade && (
                                <Check size={13} color={C.blue} />
                              )}
                            </Pressable>
                          ))}
                        </View>
                      )}

                      {existing && existing.grade === null && (
                        <Text style={styles.warning}>
                          Previous numeric result found.
                          Select the corresponding letter
                          grade and save to update it.
                        </Text>
                      )}

                      {existing &&
                        existing.credits !== course.credits && (
                          <Text style={styles.warning}>
                            Course credits have changed.
                            Update Result to save the
                            latest total credits.
                          </Text>
                        )}

                      <Pressable
                        onPress={() => save(course)}
                        disabled={
                          savingKey !== null ||
                          deletingKey !== null
                        }
                        style={[
                          styles.saveButton,
                          (savingKey !== null ||
                            deletingKey !== null) &&
                            styles.disabled,
                        ]}
                      >
                        {savingKey === course.key ? (
                          <ActivityIndicator
                            color={C.white}
                            size="small"
                          />
                        ) : (
                          <Save size={18} color={C.white} />
                        )}

                        <Text style={styles.saveText}>
                          {savingKey === course.key
                            ? "Saving..."
                            : existing
                              ? "Update Result"
                              : "Save Result"}
                        </Text>
                      </Pressable>

                      {existing && (
                        <Pressable
                          onPress={() => remove(course)}
                          disabled={
                            savingKey !== null ||
                            deletingKey !== null
                          }
                          style={styles.removeButton}
                        >
                          <Trash2 size={16} color={C.red} />

                          <Text style={styles.removeText}>
                            Remove Saved Result
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </>
      )}

      <View style={styles.notice}>
        <Info size={20} color={C.blue} />

        <Text style={styles.noticeText}>
          GPA and CGPA use your saved letter grades
          and automatically combined course credits.
          Only saved course results are included.
          University-specific repeat and eligibility
          rules are not applied.
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
    paddingBottom: 60,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.bg,
  },
  loadingText: {
    color: C.muted,
    fontSize: 13,
    marginTop: 14,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: C.border,
  },
  eyebrow: {
    color: C.blue,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 7,
  },
  heading: {
    color: C.text,
    fontSize: 29,
    fontWeight: "800",
  },
  subtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 22,
  },
  hero: {
    backgroundColor: C.navy,
    borderRadius: 23,
    padding: 23,
    marginBottom: 27,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  heroTag: {
    color: "#CFE0FF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    backgroundColor: "#2E4B83",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
  },
  heroLabel: {
    color: "#CFE0FF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroValue: {
    color: C.white,
    fontSize: 44,
    fontWeight: "800",
    marginTop: 9,
  },
  heroMax: {
    color: "#BFCFEF",
    fontSize: 17,
  },
  heroCaption: {
    color: "#CCD9F3",
    fontSize: 12,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 15,
  },
  sectionNumber: {
    backgroundColor: "#DFEAFD",
    width: 30,
    height: 30,
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
  semesterDropdown: {
    backgroundColor: C.white,
    borderColor: "#BBD0F6",
    borderWidth: 1,
    borderRadius: 17,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 12,
  },
  semesterDropdownIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  semesterDropdownInfo: {
    flex: 1,
  },
  dropdownLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 5,
  },
  dropdownValue: {
    color: C.navy,
    fontSize: 15,
    fontWeight: "800",
  },
  dropdownYear: {
    color: C.muted,
    fontSize: 11,
    marginTop: 4,
  },
  dropdownOptions: {
    backgroundColor: C.white,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
    marginBottom: 15,
  },
  dropdownOption: {
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  activeOption: {
    backgroundColor: C.lightBlue,
  },
  optionTitle: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
  },
  optionSubtitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: C.lightBlue,
    borderRadius: 17,
    padding: 19,
    flexDirection: "row",
    marginBottom: 28,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "#C4D5F4",
    marginHorizontal: 12,
  },
  summaryLabel: {
    color: "#607394",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 9,
  },
  summaryValue: {
    color: C.navy,
    fontSize: 27,
    fontWeight: "800",
  },
  progressCard: {
    backgroundColor: C.white,
    padding: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 17,
  },
  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
  },
  progressSubtitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 5,
  },
  progressPercent: {
    color: C.blue,
    fontSize: 19,
    fontWeight: "800",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#E7EDF7",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 15,
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.blue,
    borderRadius: 6,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 11,
  },
  filterTitle: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 19,
  },
  filterButton: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
    paddingVertical: 11,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  filterButtonText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  filterTextActive: {
    color: C.white,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  resultsLabel: {
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
  },
  resultsHint: {
    color: C.muted,
    fontSize: 11,
  },
  courseCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    marginBottom: 12,
    overflow: "hidden",
  },
  courseCardExpanded: {
    borderColor: "#BBD0F6",
  },
  courseHeader: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: C.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
  },
  courseCode: {
    color: C.blue,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },
  courseTypes: {
    color: C.muted,
    fontSize: 11,
    marginTop: 4,
  },
  courseRight: {
    alignItems: "flex-end",
    gap: 9,
  },
  savedBadge: {
    backgroundColor: "#E7F7EE",
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  savedText: {
    color: C.green,
    fontWeight: "800",
    fontSize: 11,
  },
  pendingBadge: {
    backgroundColor: "#FFF4E5",
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pendingText: {
    color: "#A46A1C",
    fontWeight: "800",
    fontSize: 11,
  },
  expandedContent: {
    paddingHorizontal: 17,
    paddingBottom: 18,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 18,
  },
  label: {
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 9,
  },
  creditBreakdown: {
    borderWidth: 1,
    borderColor: "#C5D8F5",
    borderRadius: 13,
    backgroundColor: "#F7F9FF",
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  creditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  creditRowLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  creditRowValue: {
    color: C.navy,
    fontSize: 13,
    fontWeight: "800",
  },
  creditTotalRow: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  creditTotalLabel: {
    color: C.navy,
    fontSize: 13,
    fontWeight: "800",
  },
  creditTotalValue: {
    color: C.blue,
    fontSize: 21,
    fontWeight: "800",
  },
  autoCreditNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 20,
  },
  autoCreditText: {
    color: C.green,
    fontSize: 11,
    fontWeight: "700",
  },
  gradeSelector: {
    backgroundColor: "#F7F9FF",
    borderWidth: 1,
    borderColor: "#BBD0F6",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  gradeSelectorInfo: {
    flex: 1,
  },
  gradeSelected: {
    color: C.navy,
    fontSize: 17,
    fontWeight: "800",
  },
  gradeHint: {
    color: C.muted,
    fontSize: 11,
    marginTop: 4,
  },
  gradeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  gradeOption: {
    width: "30%",
    flexGrow: 1,
    minHeight: 68,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  gradeOptionActive: {
    backgroundColor: C.lightBlue,
    borderColor: C.blue,
  },
  gradeOptionText: {
    color: C.text,
    fontSize: 16,
    fontWeight: "800",
  },
  gradeOptionTextActive: {
    color: C.blue,
  },
  gradePointText: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
  infoBox: {
    flexDirection: "row",
    gap: 9,
    padding: 12,
    borderRadius: 12,
    backgroundColor: C.lightBlue,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    color: C.navy,
    fontSize: 11,
    lineHeight: 18,
  },
  warning: {
    color: "#A66516",
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: C.blue,
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  saveText: {
    color: C.white,
    fontWeight: "800",
    fontSize: 14,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 13,
    marginTop: 5,
  },
  removeText: {
    color: C.red,
    fontSize: 12,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: C.white,
    borderRadius: 17,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    color: C.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
  },
  linkButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 13,
  },
  linkText: {
    color: C.blue,
    fontSize: 13,
    fontWeight: "800",
  },
  notice: {
    backgroundColor: C.lightBlue,
    borderRadius: 15,
    flexDirection: "row",
    gap: 11,
    padding: 16,
    marginTop: 16,
  },
  noticeText: {
    flex: 1,
    color: "#607394",
    fontSize: 12,
    lineHeight: 19,
  },
  muted: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  disabled: {
    opacity: 0.6,
  },
});
