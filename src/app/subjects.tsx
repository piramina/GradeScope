
import { router, useFocusEffect } from "expo-router";
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Search,
  Save,
  Trash2,
  X,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getSemesters, type Semester } from "../database/semester";
import {
  addSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
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
};

type SubjectType = "Theory" | "Practical";
type SubjectFilter = "All" | "Theory" | "Practical";

export default function SubjectsScreen() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesterId, setSemesterId] = useState<number | null>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("");
  const [type, setType] = useState<SubjectType>("Theory");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SubjectFilter>("All");

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [semesterRows, subjectRows] = await Promise.all([
        getSemesters(),
        getSubjects(),
      ]);

      setSemesters(semesterRows);
      setSubjects(subjectRows);

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
      console.error("Subject loading error:", error);
      Alert.alert("Error", "Unable to load subjects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const selectedSemester = semesters.find(
    (semester) => semester.id === semesterId,
  );

  const semesterSubjects = useMemo(() => {
    return subjects
      .filter((subject) => subject.semester_id === semesterId)
      .sort((a, b) => {
        const codeCompare = a.code.localeCompare(b.code);

        if (codeCompare !== 0) {
          return codeCompare;
        }

        return a.type.localeCompare(b.type);
      });
  }, [subjects, semesterId]);

  const filteredSubjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return semesterSubjects.filter((subject) => {
      const matchesSearch =
        query.length === 0 ||
        subject.code.toLowerCase().includes(query) ||
        subject.name.toLowerCase().includes(query);

      const matchesType =
        filter === "All" || subject.type === filter;

      return matchesSearch && matchesType;
    });
  }, [semesterSubjects, search, filter]);

  const uniqueCourses = new Set(
    semesterSubjects.map((subject) =>
      subject.code.trim().toUpperCase(),
    ),
  ).size;

  const theoryCount = semesterSubjects.filter(
    (subject) => subject.type === "Theory",
  ).length;

  const practicalCount = semesterSubjects.filter(
    (subject) => subject.type === "Practical",
  ).length;

  const selectedCourseParts = useMemo(() => {
    if (!selectedSubject) {
      return [];
    }

    const selectedCode = selectedSubject.code.trim().toUpperCase();

    return subjects.filter(
      (subject) =>
        subject.semester_id === selectedSubject.semester_id &&
        subject.code.trim().toUpperCase() === selectedCode,
    );
  }, [subjects, selectedSubject]);

  const theoryCredits = selectedCourseParts
    .filter((subject) => subject.type === "Theory")
    .reduce((sum, subject) => sum + Number(subject.credits), 0);

  const practicalCredits = selectedCourseParts
    .filter((subject) => subject.type === "Practical")
    .reduce((sum, subject) => sum + Number(subject.credits), 0);

  const totalCredits = theoryCredits + practicalCredits;

  const detailsSemester = selectedSubject
    ? semesters.find(
        (semester) => semester.id === selectedSubject.semester_id,
      )
    : null;

  const hasActiveFilters = search.trim() !== "" || filter !== "All";

  const clearFilters = () => {
    setSearch("");
    setFilter("All");
    Keyboard.dismiss();
  };

  const resetForm = () => {
    setCode("");
    setName("");
    setCredits("");
    setType("Theory");
    setEditingId(null);
    setShowForm(false);
    Keyboard.dismiss();
  };

  const selectSemester = (id: number) => {
    setSemesterId(id);
    setShowDropdown(false);
    setSelectedSubject(null);
    clearFilters();
    resetForm();
  };

  const startAdd = () => {
    setCode("");
    setName("");
    setCredits("");
    setType("Theory");
    setEditingId(null);
    setShowDropdown(false);
    setShowForm(true);
    Keyboard.dismiss();
  };

  const startEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setCode(subject.code);
    setName(subject.name);
    setCredits(String(subject.credits));
    setType(subject.type);
    setShowDropdown(false);
    setSelectedSubject(null);
    setShowForm(true);
    Keyboard.dismiss();
  };

  const saveSubject = async () => {
    if (saving || deletingId !== null) {
      return;
    }

    if (semesterId === null) {
      Alert.alert("Select Semester", "Please select a semester first.");
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    const creditValue = Number(credits);

    if (!cleanCode) {
      Alert.alert("Course Code Required", "Please enter a course code.");
      return;
    }

    if (!cleanName) {
      Alert.alert("Course Name Required", "Please enter a course name.");
      return;
    }

    if (
      credits.trim() === "" ||
      !Number.isFinite(creditValue) ||
      creditValue <= 0
    ) {
      Alert.alert(
        "Invalid Credits",
        "Enter valid credits greater than zero.",
      );
      return;
    }

    const duplicate = subjects.some(
      (subject) =>
        subject.id !== editingId &&
        subject.semester_id === semesterId &&
        subject.code.trim().toUpperCase() === cleanCode &&
        subject.type === type,
    );

    if (duplicate) {
      Alert.alert(
        "Duplicate Subject",
        `This semester already contains ${cleanCode} (${type}).`,
      );
      return;
    }

    const wasEditing = editingId !== null;

    try {
      setSaving(true);

      const data = {
        semester_id: semesterId,
        code: cleanCode,
        name: cleanName,
        credits: creditValue,
        type,
      };

      if (editingId !== null) {
        await updateSubject(editingId, data);
      } else {
        await addSubject(data);
      }

      resetForm();
      await load();

      Alert.alert(
        "Success",
        wasEditing
          ? "Subject updated successfully."
          : "Subject added successfully.",
      );
    } catch (error) {
      console.error("Subject save error:", error);
      Alert.alert(
        "Save Failed",
        "Unable to save subject. Please check the details.",
      );
    } finally {
      setSaving(false);
    }
  };

  const removeSubject = (subject: Subject) => {
    if (saving || deletingId !== null) {
      return;
    }

    Alert.alert(
      "Delete Subject",
      `Delete ${subject.code} (${subject.type})? Related saved ICA marks may also be deleted.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(subject.id);
              await deleteSubject(subject.id);

              if (editingId === subject.id) {
                resetForm();
              }

              if (selectedSubject?.id === subject.id) {
                setSelectedSubject(null);
              }

              await load();
            } catch (error) {
              console.error("Subject delete error:", error);
              Alert.alert(
                "Delete Failed",
                "Unable to delete this subject.",
              );
            } finally {
              setDeletingId(null);
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
          Loading subjects...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>
          ACADEMIC MANAGEMENT
        </Text>

        <Text style={styles.heading}>
          Manage Subjects
        </Text>

        <Text style={styles.subtitle}>
          Organize, search and filter your subjects semester by semester.
        </Text>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <BookOpen size={28} color="#CFE0FF" />
            <Text style={styles.heroTag}>
              OFFLINE STORAGE
            </Text>
          </View>

          <Text style={styles.heroLabel}>
            SUBJECT MANAGER
          </Text>

          <Text style={styles.heroTitle}>
            Your Courses
          </Text>

          <Text style={styles.heroDescription}>
            Add and manage Theory and Practical subjects in each semester.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionNumber}>
            <Text style={styles.sectionNumberText}>
              01
            </Text>
          </View>

          <CalendarDays size={20} color={C.blue} />

          <Text style={styles.sectionTitle}>
            Choose Semester
          </Text>
        </View>

        {semesters.length === 0 ? (
          <View style={styles.emptyCard}>
            <CalendarDays size={35} color="#A7B8D7" />

            <Text style={styles.emptyTitle}>
              No semesters available
            </Text>

            <Text style={styles.emptyText}>
              Create a semester before adding subjects.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/semesters")}
            >
              <Plus size={18} color={C.white} />
              <Text style={styles.primaryText}>
                Add Semester
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable
              style={styles.semesterDropdown}
              onPress={() =>
                setShowDropdown((current) => !current)
              }
            >
              <View style={styles.semesterIcon}>
                <CalendarDays size={22} color={C.blue} />
              </View>

              <View style={styles.semesterInfo}>
                <Text style={styles.dropdownLabel}>
                  SELECTED SEMESTER
                </Text>

                <Text style={styles.dropdownValue}>
                  {selectedSemester?.name ?? "Choose Semester"}
                </Text>

                <Text style={styles.dropdownYear}>
                  {selectedSemester?.academic_year}
                </Text>
              </View>

              {showDropdown ? (
                <ChevronUp size={21} color={C.blue} />
              ) : (
                <ChevronDown size={21} color={C.blue} />
              )}
            </Pressable>

            {showDropdown && (
              <View style={styles.dropdownOptions}>
                {semesters.map((semester) => {
                  const count = subjects.filter(
                    (subject) =>
                      subject.semester_id === semester.id,
                  ).length;

                  return (
                    <Pressable
                      key={semester.id}
                      onPress={() =>
                        selectSemester(semester.id)
                      }
                      style={[
                        styles.dropdownOption,
                        semesterId === semester.id &&
                          styles.dropdownOptionActive,
                      ]}
                    >
                      <View style={styles.optionInfo}>
                        <Text style={styles.optionName}>
                          {semester.name}
                        </Text>

                        <Text style={styles.optionYear}>
                          {semester.academic_year}
                          {"  •  "}
                          {count} entries
                        </Text>
                      </View>

                      {semesterId === semester.id && (
                        <Check size={19} color={C.blue} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Layers size={21} color={C.blue} />
                <Text style={styles.statValue}>
                  {uniqueCourses}
                </Text>
                <Text style={styles.statLabel}>
                  Unique Courses
                </Text>
              </View>

              <View style={styles.statCard}>
                <BookOpen size={21} color={C.blue} />
                <Text style={styles.statValue}>
                  {semesterSubjects.length}
                </Text>
                <Text style={styles.statLabel}>
                  Subject Entries
                </Text>
              </View>
            </View>

            <View style={styles.typeSummary}>
              <View style={styles.typeSummaryItem}>
                <View style={styles.theoryDot} />
                <Text style={styles.typeSummaryText}>
                  Theory: {theoryCount}
                </Text>
              </View>

              <View style={styles.typeSummaryItem}>
                <View style={styles.practicalDot} />
                <Text style={styles.typeSummaryText}>
                  Practical: {practicalCount}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>
                  02
                </Text>
              </View>

              <GraduationCap size={21} color={C.blue} />

              <Text style={styles.sectionTitle}>
                Semester Subjects
              </Text>
            </View>

            {!showForm && (
              <Pressable
                style={styles.primaryButton}
                onPress={startAdd}
              >
                <Plus size={19} color={C.white} />

                <Text style={styles.primaryText}>
                  Add Subject
                </Text>
              </Pressable>
            )}

            {showForm && (
              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <Text style={styles.formTitle}>
                    {editingId !== null
                      ? "Edit Subject"
                      : "Add New Subject"}
                  </Text>

                  <Pressable
                    onPress={resetForm}
                    disabled={saving}
                    style={styles.closeButton}
                  >
                    <X size={20} color={C.muted} />
                  </Pressable>
                </View>

                <View style={styles.formSemester}>
                  <CalendarDays size={17} color={C.blue} />

                  <Text style={styles.formSemesterText}>
                    {selectedSemester?.name}
                  </Text>
                </View>

                <Text style={styles.label}>
                  Course Code
                </Text>

                <TextInput
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  placeholder="e.g. CSC2201"
                  placeholderTextColor="#9AA7BB"
                  autoCapitalize="characters"
                  maxLength={30}
                />

                <Text style={styles.label}>
                  Course Name
                </Text>

                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Database Systems"
                  placeholderTextColor="#9AA7BB"
                  maxLength={120}
                />

                <Text style={styles.label}>
                  Credits
                </Text>

                <TextInput
                  style={styles.input}
                  value={credits}
                  onChangeText={setCredits}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 3"
                  placeholderTextColor="#9AA7BB"
                />

                <Text style={styles.label}>
                  Subject Type
                </Text>

                <View style={styles.typeRow}>
                  {(["Theory", "Practical"] as SubjectType[]).map(
                    (option) => (
                      <Pressable
                        key={option}
                        onPress={() => setType(option)}
                        style={[
                          styles.typeButton,
                          type === option &&
                            styles.typeButtonActive,
                        ]}
                      >
                        {type === option && (
                          <Check
                            size={16}
                            color={C.white}
                          />
                        )}

                        <Text
                          style={[
                            styles.typeButtonText,
                            type === option &&
                              styles.typeButtonTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    ),
                  )}
                </View>

                <Pressable
                  style={[
                    styles.saveButton,
                    saving && styles.disabled,
                  ]}
                  onPress={saveSubject}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator
                      size="small"
                      color={C.white}
                    />
                  ) : (
                    <Save size={18} color={C.white} />
                  )}

                  <Text style={styles.saveText}>
                    {saving
                      ? "Saving..."
                      : editingId !== null
                        ? "Update Subject"
                        : "Save Subject"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.cancelButton}
                  onPress={resetForm}
                  disabled={saving}
                >
                  <Text style={styles.cancelText}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            )}

            <View style={styles.searchCard}>
              <View style={styles.searchHeader}>
                <Search size={19} color={C.blue} />

                <Text style={styles.searchTitle}>
                  Search Subjects
                </Text>
              </View>

              <View style={styles.searchInputWrap}>
                <Search size={19} color={C.muted} />

                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search name or course code..."
                  placeholderTextColor="#9AA7BB"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />

                {search.length > 0 && (
                  <Pressable
                    onPress={() => setSearch("")}
                    style={styles.clearSearchButton}
                  >
                    <X size={18} color={C.muted} />
                  </Pressable>
                )}
              </View>

              <Text style={styles.filterLabel}>
                Filter by Type
              </Text>

              <View style={styles.filterRow}>
                {(
                  ["All", "Theory", "Practical"] as SubjectFilter[]
                ).map((option) => {
                  const count =
                    option === "All"
                      ? semesterSubjects.length
                      : option === "Theory"
                        ? theoryCount
                        : practicalCount;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setFilter(option);
                        Keyboard.dismiss();
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
                            styles.filterButtonTextActive,
                        ]}
                      >
                        {option} ({count})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.searchFooter}>
                <Text style={styles.searchResultText}>
                  Showing {filteredSubjects.length} of{" "}
                  {semesterSubjects.length} entries
                </Text>

                {hasActiveFilters && (
                  <Pressable onPress={clearFilters}>
                    <Text style={styles.resetText}>
                      Clear Filters
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            <View style={styles.resultsHeader}>
              <Text style={styles.resultsLabel}>
                {filteredSubjects.length} subject entries
              </Text>

              <Text style={styles.resultsHint}>
                {selectedSemester?.name}
              </Text>
            </View>

            {semesterSubjects.length === 0 ? (
              <View style={styles.emptyCard}>
                <BookOpen size={35} color="#A7B8D7" />

                <Text style={styles.emptyTitle}>
                  No subjects in this semester
                </Text>

                <Text style={styles.emptyText}>
                  Add your first subject for the selected semester.
                </Text>
              </View>
            ) : filteredSubjects.length === 0 ? (
              <View style={styles.emptyCard}>
                <Search size={35} color="#A7B8D7" />

                <Text style={styles.emptyTitle}>
                  No Matching Subjects
                </Text>

                <Text style={styles.emptyText}>
                  Try a different course name, code or subject type.
                </Text>

                <Pressable
                  style={styles.clearFiltersButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersText}>
                    Clear Filters
                  </Text>
                </Pressable>
              </View>
            ) : (
              filteredSubjects.map((subject) => (
                <View
                  key={subject.id}
                  style={styles.subjectCard}
                >
                  <View style={styles.subjectTop}>
                    <View style={styles.subjectIcon}>
                      <BookOpen
                        size={22}
                        color={C.blue}
                      />
                    </View>

                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>
                        {subject.name}
                      </Text>

                      <Text style={styles.subjectCode}>
                        {subject.code}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.typeBadge,
                        subject.type === "Theory"
                          ? styles.theoryBadge
                          : styles.practicalBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
                          subject.type === "Theory"
                            ? styles.theoryText
                            : styles.practicalText,
                        ]}
                      >
                        {subject.type}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.subjectBottom}>
                    <View style={styles.creditBadge}>
                      <GraduationCap
                        size={16}
                        color={C.blue}
                      />

                      <Text style={styles.creditText}>
                        {subject.credits} Credits
                      </Text>
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        style={styles.viewButton}
                        onPress={() => {
                          setSelectedSubject(subject);
                          Keyboard.dismiss();
                        }}
                        disabled={saving || deletingId !== null}
                        accessibilityRole="button"
                        accessibilityLabel={`View details for ${subject.code}`}
                      >
                        <Eye
                          size={17}
                          color={C.green}
                        />
                      </Pressable>

                      <Pressable
                        style={styles.editButton}
                        onPress={() => startEdit(subject)}
                        disabled={saving || deletingId !== null}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${subject.code}`}
                      >
                        <Pencil
                          size={17}
                          color={C.blue}
                        />
                      </Pressable>

                      <Pressable
                        style={styles.deleteButton}
                        onPress={() =>
                          removeSubject(subject)
                        }
                        disabled={saving || deletingId !== null}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${subject.code}`}
                      >
                        {deletingId === subject.id ? (
                          <ActivityIndicator
                            size="small"
                            color={C.red}
                          />
                        ) : (
                          <Trash2
                            size={17}
                            color={C.red}
                          />
                        )}
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}

            <View style={styles.notice}>
              <BookOpen size={19} color={C.blue} />

              <Text style={styles.noticeText}>
                Subjects are organized by semester.
                The same course code can have one Theory
                and one Practical entry, but duplicate
                entries of the same type are not allowed.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={selectedSubject !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSubject(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedSubject(null)}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <BookOpen size={23} color={C.blue} />
              </View>

              <View style={styles.modalHeaderText}>
                <Text style={styles.modalEyebrow}>
                  COURSE INFORMATION
                </Text>

                <Text style={styles.modalTitle}>
                  Subject Details
                </Text>
              </View>

              <Pressable
                onPress={() => setSelectedSubject(null)}
                style={styles.closeButton}
              >
                <X size={22} color={C.muted} />
              </Pressable>
            </View>

            {selectedSubject && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailsContent}
              >
                <Text style={styles.detailCourseName}>
                  {selectedSubject.name}
                </Text>

                <Text style={styles.detailCourseCode}>
                  {selectedSubject.code}
                </Text>

                <View style={styles.detailsDivider} />

                <Text style={styles.detailLabel}>
                  Semester
                </Text>

                <Text style={styles.detailValue}>
                  {detailsSemester?.name ?? "Unknown"}
                </Text>

                <Text style={styles.detailSecondary}>
                  {detailsSemester?.academic_year ?? ""}
                </Text>

                <Text style={styles.detailLabel}>
                  Selected Subject Type
                </Text>

                <View
                  style={[
                    styles.detailTypeBadge,
                    selectedSubject.type === "Theory"
                      ? styles.theoryBadge
                      : styles.practicalBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      selectedSubject.type === "Theory"
                        ? styles.theoryText
                        : styles.practicalText,
                    ]}
                  >
                    {selectedSubject.type}
                  </Text>
                </View>

                <View style={styles.detailsDivider} />

                <Text style={styles.detailsSectionTitle}>
                  Credit Breakdown
                </Text>

                <View style={styles.creditRow}>
                  <Text style={styles.creditRowLabel}>
                    Theory Credits
                  </Text>

                  <Text style={styles.creditRowValue}>
                    {theoryCredits}
                  </Text>
                </View>

                <View style={styles.creditRow}>
                  <Text style={styles.creditRowLabel}>
                    Practical Credits
                  </Text>

                  <Text style={styles.creditRowValue}>
                    {practicalCredits}
                  </Text>
                </View>

                <View style={styles.totalCreditCard}>
                  <View>
                    <Text style={styles.totalCreditLabel}>
                      TOTAL COURSE CREDITS
                    </Text>

                    <Text style={styles.totalCreditHint}>
                      Theory + Practical
                    </Text>
                  </View>

                  <Text style={styles.totalCreditValue}>
                    {totalCredits}
                  </Text>
                </View>

                <Text style={styles.detailNote}>
                  Credits are calculated using subjects
                  with the same course code in this semester.
                </Text>

                <Pressable
                  style={styles.modalDoneButton}
                  onPress={() => setSelectedSubject(null)}
                >
                  <Check size={18} color={C.white} />

                  <Text style={styles.modalDoneText}>
                    Done
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
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
    marginTop: 7,
    marginBottom: 22,
    lineHeight: 20,
  },
  hero: {
    backgroundColor: C.navy,
    borderRadius: 23,
    padding: 22,
    marginBottom: 27,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 19,
  },
  heroTag: {
    color: "#CFE0FF",
    backgroundColor: "#2E4B83",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  heroLabel: {
    color: "#CFE0FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    color: C.white,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 8,
  },
  heroDescription: {
    color: "#D5E0FA",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
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
    borderRadius: 10,
    backgroundColor: "#DFEAFD",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionNumberText: {
    color: C.blue,
    fontSize: 11,
    fontWeight: "800",
  },
  sectionTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  semesterDropdown: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: "#BBD0F6",
    borderRadius: 17,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 12,
  },
  semesterIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  semesterInfo: {
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
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 8,
    marginBottom: 16,
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
  },
  dropdownOptionActive: {
    backgroundColor: C.lightBlue,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
  },
  optionYear: {
    color: C.muted,
    fontSize: 11,
    marginTop: 5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 17,
    gap: 9,
  },
  statValue: {
    color: C.navy,
    fontSize: 27,
    fontWeight: "800",
  },
  statLabel: {
    color: C.muted,
    fontSize: 11,
  },
  typeSummary: {
    backgroundColor: C.lightBlue,
    borderRadius: 13,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 28,
  },
  typeSummaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeSummaryText: {
    color: C.navy,
    fontSize: 12,
    fontWeight: "700",
  },
  theoryDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: C.blue,
  },
  practicalDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: C.green,
  },
  primaryButton: {
    backgroundColor: C.blue,
    borderRadius: 13,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    marginBottom: 17,
  },
  primaryText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "800",
  },
  formCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: "#BBD0F6",
    borderRadius: 19,
    padding: 18,
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  formTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
  },
  closeButton: {
    padding: 7,
  },
  formSemester: {
    backgroundColor: C.lightBlue,
    padding: 12,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 20,
  },
  formSemesterText: {
    color: C.navy,
    fontSize: 13,
    fontWeight: "700",
  },
  label: {
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 9,
  },
  input: {
    height: 51,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: C.text,
    fontSize: 15,
    marginBottom: 19,
  },
  typeRow: {
    flexDirection: "row",
    gap: 11,
    marginBottom: 23,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  typeButtonActive: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  typeButtonText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  typeButtonTextActive: {
    color: C.white,
  },
  saveButton: {
    backgroundColor: C.blue,
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },
  saveText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "800",
  },
  cancelButton: {
    padding: 15,
    alignItems: "center",
  },
  cancelText: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  searchCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 17,
    marginBottom: 20,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 15,
  },
  searchTitle: {
    color: C.navy,
    fontSize: 15,
    fontWeight: "800",
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F7F9FF",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    height: 51,
    marginBottom: 17,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    height: "100%",
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: 5,
  },
  filterLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 11,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: C.blue,
    borderColor: C.blue,
  },
  filterButtonText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  filterButtonTextActive: {
    color: C.white,
  },
  searchFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  searchResultText: {
    color: C.muted,
    fontSize: 11,
    flexShrink: 1,
  },
  resetText: {
    color: C.blue,
    fontSize: 11,
    fontWeight: "800",
  },
  clearFiltersButton: {
    backgroundColor: C.lightBlue,
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 8,
  },
  clearFiltersText: {
    color: C.blue,
    fontSize: 13,
    fontWeight: "800",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  resultsLabel: {
    color: C.text,
    fontSize: 13,
    fontWeight: "800",
  },
  resultsHint: {
    color: C.muted,
    fontSize: 11,
    flexShrink: 1,
    textAlign: "right",
  },
  subjectCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 16,
    marginBottom: 12,
  },
  subjectTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 16,
  },
  subjectIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: C.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
  },
  subjectCode: {
    color: C.blue,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },
  typeBadge: {
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  theoryBadge: {
    backgroundColor: C.lightBlue,
  },
  practicalBadge: {
    backgroundColor: "#E7F7EE",
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  theoryText: {
    color: C.blue,
  },
  practicalText: {
    color: C.green,
  },
  subjectBottom: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  creditBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  creditText: {
    color: C.navy,
    fontSize: 12,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 9,
  },
  viewButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#E7F7EE",
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: C.lightBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#FFF0F1",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 17,
    padding: 26,
    alignItems: "center",
    gap: 11,
    marginBottom: 15,
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
    lineHeight: 19,
    textAlign: "center",
  },
  notice: {
    backgroundColor: C.lightBlue,
    borderRadius: 15,
    padding: 16,
    marginTop: 12,
    flexDirection: "row",
    gap: 11,
  },
  noticeText: {
    flex: 1,
    color: "#607394",
    fontSize: 12,
    lineHeight: 19,
  },
  disabled: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: C.white,
    borderRadius: 23,
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 19,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  modalHeaderIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: C.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderText: {
    flex: 1,
  },
  modalEyebrow: {
    color: C.blue,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 5,
  },
  modalTitle: {
    color: C.navy,
    fontSize: 18,
    fontWeight: "800",
  },
  detailsContent: {
    padding: 21,
    paddingBottom: 25,
  },
  detailCourseName: {
    color: C.navy,
    fontSize: 21,
    fontWeight: "800",
  },
  detailCourseCode: {
    color: C.blue,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 20,
  },
  detailLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 7,
  },
  detailValue: {
    color: C.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 7,
  },
  detailSecondary: {
    color: C.muted,
    fontSize: 12,
    marginBottom: 20,
  },
  detailTypeBadge: {
    alignSelf: "flex-start",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  detailsSectionTitle: {
    color: C.navy,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 17,
  },
  creditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  creditRowLabel: {
    color: C.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  creditRowValue: {
    color: C.navy,
    fontSize: 16,
    fontWeight: "800",
  },
  totalCreditCard: {
    backgroundColor: C.lightBlue,
    borderRadius: 15,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 9,
  },
  totalCreditLabel: {
    color: C.navy,
    fontSize: 12,
    fontWeight: "800",
  },
  totalCreditHint: {
    color: C.muted,
    fontSize: 11,
    marginTop: 6,
  },
  totalCreditValue: {
    color: C.blue,
    fontSize: 30,
    fontWeight: "800",
  },
  detailNote: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 15,
    marginBottom: 22,
  },
  modalDoneButton: {
    backgroundColor: C.blue,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
  },
  modalDoneText: {
    color: C.white,
    fontSize: 14,
    fontWeight: "800",
  },
});
