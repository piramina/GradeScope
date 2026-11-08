import { useFocusEffect } from "expo-router";
import {
  BookOpen,
  Check,
  Layers3,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  addSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
  type Subject,
  type SubjectInput,
} from "../database/subject";

import {
  getSemesters,
  initDatabase,
  type Semester,
} from "../database/semester";

const C = {
  navy: "#142D60",
  blue: "#3164D6",
  background: "#F5F7FC",
  white: "#FFFFFF",
  text: "#17233B",
  muted: "#718096",
  border: "#E6EBF3",
  lightBlue: "#EAF1FF",
  red: "#DC3545",
};

type AssessmentType = "Theory" | "Practical";

export default function SubjectsScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("3");
  const [type, setType] = useState<AssessmentType>("Theory");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      await initDatabase();

      const [subjectRows, semesterRows] = await Promise.all([
        getSubjects(),
        getSemesters(),
      ]);

      setSubjects(subjectRows);
      setSemesters(semesterRows);
    } catch (error) {
      console.error("Subject load error:", error);
      Alert.alert(
        "Loading Failed",
        "Unable to load subjects. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const resetForm = () => {
    setSemesterId(null);
    setCode("");
    setName("");
    setCredits("3");
    setType("Theory");
    setEditingId(null);
    setShowForm(false);
    Keyboard.dismiss();
  };

  const openAddForm = () => {
    if (semesters.length === 0) {
      Alert.alert(
        "Semester Required",
        "Please create a semester before adding subjects.",
      );
      return;
    }

    resetForm();
    setSemesterId(semesters[0].id);
    setShowForm(true);
  };

  const openEditForm = (subject: Subject) => {
    setEditingId(subject.id);
    setSemesterId(subject.semester_id);
    setCode(subject.code);
    setName(subject.name);
    setCredits(String(subject.credits));
    setType(subject.type);
    setShowForm(true);
  };

  const saveSubject = async () => {
    if (saving) return;

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();
    const creditValue = Number(credits);

    if (!semesterId) {
      Alert.alert("Semester Required", "Please select a semester.");
      return;
    }

    if (!cleanCode || !cleanName) {
      Alert.alert(
        "Missing Details",
        "Please enter the subject code and subject name.",
      );
      return;
    }

    if (
      !credits.trim() ||
      !Number.isFinite(creditValue) ||
      creditValue <= 0 ||
      creditValue > 30
    ) {
      Alert.alert(
        "Invalid Credits",
        "Please enter valid credits greater than 0 and up to 30.",
      );
      return;
    }

    // Same course code is allowed once for Theory
    // and once for Practical within a semester.
    const duplicate = subjects.find(
      (subject) =>
        subject.semester_id === semesterId &&
        subject.code.trim().toUpperCase() === cleanCode &&
        subject.type === type &&
        subject.id !== editingId,
    );

    if (duplicate) {
      Alert.alert(
        "Duplicate Subject",
        `${cleanCode} already has a ${type} entry in this semester. ` +
          "You can create only one Theory and one Practical entry per course code.",
      );
      return;
    }

    const data: SubjectInput = {
      semester_id: semesterId,
      code: cleanCode,
      name: cleanName,
      credits: creditValue,
      type,
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await updateSubject(editingId, data);
      } else {
        await addSubject(data);
      }

      resetForm();
      await load();
    } catch (error) {
      console.error("Subject save error:", error);

      Alert.alert(
        "Unable to Save Subject",
        "This course code and assessment type may already exist in the selected semester. Only one Theory and one Practical entry are allowed per course code.",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (subject: Subject) => {
    Alert.alert(
      "Delete Subject",
      `Are you sure you want to delete ${subject.name} (${subject.type})? Its saved ICA marks may also be removed.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (deletingId !== null) return;

            try {
              setDeletingId(subject.id);
              await deleteSubject(subject.id);
              await load();
            } catch (error) {
              console.error("Subject delete error:", error);
              Alert.alert("Delete Failed", "Unable to delete this subject.");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const totalCredits = subjects.reduce(
    (sum, subject) => sum + subject.credits,
    0,
  );

  const uniqueCourseCount = new Set(
    subjects.map(
      (subject) => `${subject.semester_id}:${subject.code.toUpperCase()}`,
    ),
  ).size;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <Text style={styles.eyebrow}>ACADEMIC MANAGEMENT</Text>

        <Text style={styles.heading}>My Subjects</Text>

        <Text style={styles.subtitle}>
          Manage your subjects, credits and assessment types.
        </Text>

        {/* SUMMARY */}
        <View style={styles.hero}>
          <View style={styles.heroItem}>
            <BookOpen size={22} color="#CFE0FF" />

            <Text style={styles.heroValue}>{uniqueCourseCount}</Text>

            <Text style={styles.heroLabel}>Unique Courses</Text>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroItem}>
            <Layers3 size={22} color="#CFE0FF" />

            <Text style={styles.heroValue}>{subjects.length}</Text>

            <Text style={styles.heroLabel}>Subject Entries</Text>
          </View>
        </View>

        <View style={styles.creditCard}>
          <Text style={styles.creditLabel}>Registered Credits</Text>

          <Text style={styles.creditValue}>{totalCredits}</Text>
        </View>

        {/* ADD SUBJECT */}
        <Pressable
          onPress={openAddForm}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Plus size={20} color={C.white} />
          <Text style={styles.primaryText}>Add New Subject</Text>
        </Pressable>

        {/* SUBJECT FORM */}
        {showForm && (
          <View style={styles.form}>
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>
                {editingId !== null ? "Edit Subject" : "New Subject"}
              </Text>

              <Pressable onPress={resetForm}>
                <X size={21} color={C.muted} />
              </Pressable>
            </View>

            <Text style={styles.label}>Select Semester</Text>

            {semesters.map((semester) => (
              <Pressable
                key={semester.id}
                onPress={() => setSemesterId(semester.id)}
                style={[
                  styles.choice,
                  semesterId === semester.id && styles.selectedChoice,
                ]}
              >
                <View style={styles.radioOuter}>
                  {semesterId === semester.id && (
                    <View style={styles.radioInner} />
                  )}
                </View>

                <Text
                  style={[
                    styles.choiceText,
                    semesterId === semester.id && styles.selectedText,
                  ]}
                >
                  {semester.name} ({semester.academic_year})
                </Text>
              </Pressable>
            ))}

            <Text style={styles.label}>Subject Code</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. CSC2201"
              placeholderTextColor="#9AA7BB"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              maxLength={30}
            />

            <Text style={styles.label}>Subject Name</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. Database Systems"
              placeholderTextColor="#9AA7BB"
              value={name}
              onChangeText={setName}
              maxLength={100}
            />

            <Text style={styles.label}>Credits</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. 3"
              placeholderTextColor="#9AA7BB"
              value={credits}
              onChangeText={setCredits}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Assessment Type</Text>

            <View style={styles.typeRow}>
              {(["Theory", "Practical"] as const).map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setType(value)}
                  style={[
                    styles.typeButton,
                    type === value && styles.selectedChoice,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      type === value && styles.selectedText,
                    ]}
                  >
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {type === "Theory"
                  ? "Theory: ICA 30% + Final Exam 70%"
                  : "Practical: ICA 40% + Final Exam 60%"}
              </Text>

              <Text style={styles.infoSubText}>
                Same semester and course code can have one Theory and one
                Practical entry.
              </Text>
            </View>

            {/* SAVE BUTTON */}
            <Pressable
              disabled={saving}
              onPress={saveSubject}
              style={[styles.primaryButton, saving && styles.disabled]}
            >
              {saving ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <Check size={19} color={C.white} />
              )}

              <Text style={styles.primaryText}>
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Subject"
                    : "Save Subject"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* SUBJECT LIST */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Registered Subjects</Text>

          <Text style={styles.countText}>{subjects.length} entries</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={C.blue} />
        ) : subjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <BookOpen size={35} color="#A7B8D7" />

            <Text style={styles.emptyTitle}>No subjects yet</Text>

            <Text style={styles.emptyText}>
              Add your first subject to start tracking your academic progress.
            </Text>
          </View>
        ) : (
          subjects.map((subject) => (
            <View key={subject.id} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <View style={styles.subjectIcon}>
                  <BookOpen size={23} color={C.blue} />
                </View>

                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>{subject.name}</Text>

                  <Text style={styles.subjectCode}>{subject.code}</Text>

                  <Text style={styles.semesterName}>
                    {subject.semester_name}
                  </Text>
                </View>

                <View
                  style={[
                    styles.typeBadge,
                    subject.type === "Practical" && styles.practicalBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBadgeText,
                      subject.type === "Practical" && styles.practicalText,
                    ]}
                  >
                    {subject.type}
                  </Text>
                </View>
              </View>

              <View style={styles.subjectMeta}>
                <Text style={styles.metaText}>{subject.credits} Credits</Text>

                <Text style={styles.metaText}>
                  {subject.type === "Theory" ? "ICA 30%" : "ICA 40%"}
                </Text>
              </View>

              {/* EDIT / DELETE */}
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => openEditForm(subject)}
                  style={({ pressed }) => [
                    styles.editButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Pencil size={16} color={C.blue} />

                  <Text style={styles.editText}>Edit</Text>
                </Pressable>

                <Pressable
                  disabled={deletingId !== null}
                  onPress={() => confirmDelete(subject)}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pressed && styles.pressed,
                    deletingId !== null && styles.disabled,
                  ]}
                >
                  <Trash2 size={16} color={C.red} />

                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
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
    padding: 20,
    paddingBottom: 60,
  },

  eyebrow: {
    fontSize: 11,
    color: C.blue,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginBottom: 7,
  },

  heading: {
    fontSize: 29,
    fontWeight: "800",
    color: C.text,
  },

  subtitle: {
    fontSize: 13,
    color: C.muted,
    marginTop: 6,
    marginBottom: 22,
  },

  hero: {
    backgroundColor: C.navy,
    borderRadius: 22,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  heroItem: {
    flex: 1,
    alignItems: "center",
    gap: 7,
  },

  heroValue: {
    fontSize: 29,
    fontWeight: "800",
    color: C.white,
  },

  heroLabel: {
    fontSize: 11,
    color: "#CFE0FF",
    textAlign: "center",
  },

  heroDivider: {
    width: 1,
    height: 65,
    backgroundColor: "#426098",
    marginHorizontal: 14,
  },

  creditCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    padding: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  creditLabel: {
    fontSize: 13,
    color: C.muted,
    fontWeight: "600",
  },

  creditValue: {
    fontSize: 23,
    color: C.navy,
    fontWeight: "800",
  },

  primaryButton: {
    backgroundColor: C.blue,
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginBottom: 20,
  },

  primaryText: {
    color: C.white,
    fontWeight: "700",
    fontSize: 15,
  },

  form: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },

  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    marginBottom: 9,
  },

  input: {
    height: 49,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    marginBottom: 17,
    color: C.text,
    fontSize: 14,
  },

  choice: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
    padding: 12,
    marginBottom: 9,
  },

  selectedChoice: {
    backgroundColor: C.lightBlue,
    borderColor: C.blue,
  },

  choiceText: {
    fontSize: 12,
    color: C.text,
    flex: 1,
  },

  selectedText: {
    color: C.blue,
    fontWeight: "700",
  },

  radioOuter: {
    width: 17,
    height: 17,
    borderWidth: 2,
    borderColor: C.blue,
    borderRadius: 9,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: C.blue,
  },

  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 13,
  },

  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },

  typeText: {
    fontSize: 13,
    color: C.text,
  },

  infoBox: {
    backgroundColor: "#F0F5FF",
    padding: 13,
    borderRadius: 12,
    marginBottom: 20,
  },

  infoText: {
    fontSize: 12,
    color: C.navy,
    fontWeight: "700",
  },

  infoSubText: {
    fontSize: 11,
    color: C.muted,
    marginTop: 7,
    lineHeight: 17,
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  countText: {
    color: C.muted,
    fontSize: 12,
  },

  emptyCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    gap: 10,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
  },

  emptyText: {
    color: C.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
  },

  subjectCard: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 13,
  },

  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  subjectIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: C.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },

  subjectInfo: {
    flex: 1,
  },

  subjectName: {
    fontSize: 14,
    fontWeight: "800",
    color: C.text,
  },

  subjectCode: {
    fontSize: 12,
    color: C.blue,
    marginTop: 5,
    fontWeight: "700",
  },

  semesterName: {
    fontSize: 11,
    color: C.muted,
    marginTop: 4,
  },

  typeBadge: {
    backgroundColor: C.lightBlue,
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  practicalBadge: {
    backgroundColor: "#E7F7EE",
  },

  typeBadgeText: {
    fontSize: 10,
    color: C.blue,
    fontWeight: "700",
  },

  practicalText: {
    color: "#218352",
  },

  subjectMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F7F9FD",
    padding: 12,
    borderRadius: 11,
    marginTop: 15,
  },

  metaText: {
    fontSize: 12,
    color: C.navy,
    fontWeight: "700",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  editButton: {
    flex: 1,
    backgroundColor: "#EEF3FF",
    borderRadius: 11,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  editText: {
    color: C.blue,
    fontWeight: "700",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#FFF0F1",
    borderRadius: 11,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  deleteText: {
    color: C.red,
    fontWeight: "700",
  },

  disabled: {
    opacity: 0.6,
  },

  pressed: {
    opacity: 0.75,
  },
});
