import { useFocusEffect } from "expo-router";
import { BookOpen, Check, Pencil, Plus, Trash2, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
    Subject,
    SubjectInput,
    updateSubject,
} from "../database/subject";

import { getSemesters, initDatabase, Semester } from "../database/semester";

const C = {
  navy: "#142D60",
  blue: "#3164D6",
  bg: "#F5F7FC",
  white: "#FFFFFF",
  text: "#17233B",
  muted: "#718096",
  border: "#E6EBF3",
};

export default function SubjectsScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [credits, setCredits] = useState("3");
  const [type, setType] = useState<"Theory" | "Practical">("Theory");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      console.error(error);
      Alert.alert("Error", "Unable to load subjects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const reset = () => {
    setSemesterId(null);
    setCode("");
    setName("");
    setCredits("3");
    setType("Theory");
    setEditingId(null);
    setShowForm(false);
  };

  const save = async () => {
    const creditValue = Number(credits);

    if (
      !semesterId ||
      !code.trim() ||
      !name.trim() ||
      !credits.trim() ||
      !Number.isFinite(creditValue) ||
      creditValue <= 0 ||
      creditValue > 30
    ) {
      Alert.alert(
        "Invalid Details",
        "Select a semester and enter valid subject details.",
      );
      return;
    }

    const data: SubjectInput = {
      semester_id: semesterId,
      code: code.trim(),
      name: name.trim(),
      credits: creditValue,
      type,
    };

    if (saving) return;

    try {
      setSaving(true);

      if (editingId !== null) {
        await updateSubject(editingId, data);
      } else {
        await addSubject(data);
      }

      reset();
      await load();
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Save Failed",
        "Could not save subject. Check whether the code already exists in this semester.",
      );
    } finally {
      setSaving(false);
    }
  };

  const edit = (subject: Subject) => {
    setEditingId(subject.id);
    setSemesterId(subject.semester_id);
    setCode(subject.code);
    setName(subject.name);
    setCredits(String(subject.credits));
    setType(subject.type);
    setShowForm(true);
  };

  const remove = (subject: Subject) => {
    Alert.alert(
      "Delete Subject",
      `Are you sure you want to delete ${subject.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSubject(subject.id);
              await load();
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Unable to delete subject.");
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>ACADEMIC MANAGEMENT</Text>
        <Text style={styles.title}>My Subjects</Text>
        <Text style={styles.subtitle}>
          Manage courses, credits and assessment types.
        </Text>

        <View style={styles.hero}>
          <View>
            <Text style={styles.heroLabel}>TOTAL SUBJECTS</Text>
            <Text style={styles.heroValue}>{subjects.length}</Text>
          </View>

          <View>
            <Text style={styles.heroLabel}>TOTAL CREDITS</Text>
            <Text style={styles.heroValue}>{totalCredits}</Text>
          </View>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            reset();
            if (semesters.length === 0) {
              Alert.alert(
                "Semester Required",
                "Please create a semester before adding subjects.",
              );
              return;
            }

            setSemesterId(semesters[0].id);
            setShowForm(true);
          }}
        >
          <Plus color="white" size={20} />
          <Text style={styles.primaryText}>Add Subject</Text>
        </Pressable>

        {showForm && (
          <View style={styles.form}>
            <View style={styles.formHeader}>
              <Text style={styles.sectionTitle}>
                {editingId !== null ? "Edit Subject" : "New Subject"}
              </Text>
              <Pressable onPress={reset}>
                <X size={20} color={C.muted} />
              </Pressable>
            </View>

            <Text style={styles.label}>Select Semester</Text>

            {semesters.map((semester) => (
              <Pressable
                key={semester.id}
                style={[
                  styles.choice,
                  semesterId === semester.id && styles.selected,
                ]}
                onPress={() => setSemesterId(semester.id)}
              >
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
            />

            <Text style={styles.label}>Subject Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Database Systems"
              placeholderTextColor="#9AA7BB"
              value={name}
              onChangeText={setName}
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
                  style={[styles.typeButton, type === value && styles.selected]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      type === value && styles.selectedText,
                    ]}
                  >
                    {value}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.helper}>
              {type === "Theory"
                ? "ICA 30% • Final Exam 70%"
                : "ICA 40% • Final Exam 60%"}
            </Text>

            <Pressable
              style={[styles.primaryButton, saving && { opacity: 0.6 }]}
              onPress={save}
              disabled={saving}
            >
              <Check color="white" size={18} />
              <Text style={styles.primaryText}>
                {saving ? "Saving..." : "Save Subject"}
              </Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.sectionTitle}>Registered Subjects</Text>

        {loading ? (
          <ActivityIndicator color={C.blue} size="large" />
        ) : subjects.length === 0 ? (
          <View style={styles.empty}>
            <BookOpen size={35} color="#A7B8D7" />
            <Text style={styles.emptyTitle}>No subjects yet</Text>
            <Text style={styles.emptyText}>
              Add your first subject to start tracking academic performance.
            </Text>
          </View>
        ) : (
          subjects.map((subject) => (
            <View key={subject.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <BookOpen size={22} color={C.blue} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{subject.name}</Text>
                  <Text style={styles.cardSub}>
                    {subject.code} • {subject.semester_name}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{subject.credits} Credits</Text>
                </View>
                <View
                  style={[
                    styles.chip,
                    subject.type === "Practical" && {
                      backgroundColor: "#E7F7EE",
                    },
                  ]}
                >
                  <Text style={styles.chipText}>{subject.type}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => edit(subject)}
                >
                  <Pencil size={16} color={C.blue} />
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => remove(subject)}
                >
                  <Trash2 size={16} color="#DC3545" />
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
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 60 },
  eyebrow: {
    color: C.blue,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginBottom: 7,
  },
  title: { fontSize: 29, fontWeight: "800", color: C.text },
  subtitle: {
    fontSize: 14,
    color: C.muted,
    marginTop: 5,
    marginBottom: 24,
  },
  hero: {
    backgroundColor: C.navy,
    borderRadius: 22,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  heroLabel: {
    color: "#CFE0FF",
    fontSize: 11,
    fontWeight: "600",
  },
  heroValue: {
    color: C.white,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: C.blue,
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 9,
    marginBottom: 23,
  },
  primaryText: {
    color: C.white,
    fontSize: 15,
    fontWeight: "700",
  },
  form: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 25,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    height: 49,
    paddingHorizontal: 13,
    marginBottom: 16,
    color: C.text,
  },
  choice: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 9,
  },
  selected: {
    backgroundColor: "#EAF1FF",
    borderColor: C.blue,
  },
  selectedText: { color: C.blue, fontWeight: "700" },
  choiceText: { color: C.text, fontSize: 13 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeButton: {
    flex: 1,
    padding: 13,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    alignItems: "center",
  },
  helper: {
    fontSize: 12,
    color: C.muted,
    marginTop: 10,
    marginBottom: 20,
  },
  empty: {
    padding: 35,
    backgroundColor: C.white,
    borderRadius: 18,
    alignItems: "center",
    gap: 9,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.text,
  },
  emptyText: {
    fontSize: 12,
    color: C.muted,
    textAlign: "center",
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 17,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  iconBox: {
    backgroundColor: "#EAF1FF",
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },
  cardSub: {
    fontSize: 11,
    color: C.muted,
    marginTop: 5,
  },
  metaRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 15,
  },
  chip: {
    backgroundColor: "#EAF1FF",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    color: C.navy,
    fontSize: 11,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    padding: 11,
    borderRadius: 11,
    backgroundColor: "#EEF3FF",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
  editText: { color: C.blue, fontWeight: "600" },
  deleteButton: {
    flex: 1,
    padding: 11,
    borderRadius: 11,
    backgroundColor: "#FFF0F1",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
  deleteText: { color: "#DC3545", fontWeight: "600" },
});
