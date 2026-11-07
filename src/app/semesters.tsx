import { useFocusEffect } from "expo-router";
import {
  CalendarDays,
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
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
  addSemester,
  deleteSemester,
  getSemesters,
  initDatabase,
  Semester,
  updateSemester,
} from "../database/semester";

const C = {
  navy: "#142D60",
  blue: "#3164D6",
  bg: "#F5F7FC",
  white: "#FFFFFF",
  text: "#17233B",
  muted: "#718096",
  border: "#E6EBF3",
};

export default function SemesterScreen() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      await initDatabase();
      const rows = await getSemesters();
      setSemesters(rows);
    } catch (error) {
      console.error(error);
      Alert.alert("Database Error", "Unable to load semesters.");
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
    setName("");
    setYear("");
    setEditingId(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!name.trim() || !year.trim()) {
      Alert.alert("Missing Details", "Enter semester and academic year.");
      return;
    }

    if (saving) return;

    try {
      setSaving(true);

      if (editingId !== null) {
        await updateSemester(editingId, name, year);
      } else {
        await addSemester(name, year);
      }

      reset();
      await load();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save semester.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (semester: Semester) => {
    setEditingId(semester.id);
    setName(semester.name);
    setYear(semester.academic_year);
    setShowForm(true);
  };

  const remove = (semester: Semester) => {
    Alert.alert("Delete Semester", `Delete ${semester.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSemester(semester.id);
            await load();
          } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not delete semester.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>ACADEMIC MANAGEMENT</Text>
        <Text style={styles.title}>My Semesters</Text>
        <Text style={styles.subtitle}>Organize your academic journey.</Text>

        <View style={styles.summary}>
          <CalendarDays size={25} color="#CFE0FF" />
          <View>
            <Text style={styles.summaryLabel}>TOTAL SEMESTERS</Text>
            <Text style={styles.summaryNumber}>{semesters.length}</Text>
          </View>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => {
            reset();
            setShowForm(true);
          }}
        >
          <Plus color="white" size={20} />
          <Text style={styles.addText}>Add Semester</Text>
        </Pressable>

        {showForm && (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.cardTitle}>
                {editingId !== null ? "Edit Semester" : "New Semester"}
              </Text>

              <Pressable onPress={reset}>
                <X size={20} color={C.muted} />
              </Pressable>
            </View>

            <Text style={styles.label}>Semester Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Year 1 - Semester 1"
              placeholderTextColor="#9AA7BB"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Academic Year</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2025/2026"
              placeholderTextColor="#9AA7BB"
              value={year}
              onChangeText={setYear}
            />

            <Pressable
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={save}
              disabled={saving}
            >
              <Check color="white" size={18} />
              <Text style={styles.saveText}>
                {saving ? "Saving..." : "Save Semester"}
              </Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.sectionTitle}>Semester Records</Text>

        {loading ? (
          <ActivityIndicator size="large" color={C.blue} />
        ) : semesters.length === 0 ? (
          <View style={styles.empty}>
            <CalendarDays size={36} color="#A7B8D7" />
            <Text style={styles.emptyTitle}>No semesters yet</Text>
            <Text style={styles.emptyText}>
              Add your first semester to get started.
            </Text>
          </View>
        ) : (
          semesters.map((semester) => (
            <View key={semester.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconBox}>
                  <CalendarDays size={23} color={C.blue} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{semester.name}</Text>
                  <Text style={styles.year}>
                    Academic Year: {semester.academic_year}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => edit(semester)}
                >
                  <Pencil size={16} color={C.blue} />
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => remove(semester)}
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
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  eyebrow: {
    color: C.blue,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginBottom: 7,
  },
  title: {
    color: C.text,
    fontSize: 29,
    fontWeight: "800",
  },
  subtitle: {
    color: C.muted,
    fontSize: 14,
    marginTop: 5,
    marginBottom: 24,
  },
  summary: {
    backgroundColor: C.navy,
    borderRadius: 22,
    padding: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 20,
  },
  summaryLabel: {
    color: "#CFE0FF",
    fontSize: 12,
    fontWeight: "600",
  },
  summaryNumber: {
    color: "white",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 3,
  },
  addButton: {
    backgroundColor: C.blue,
    borderRadius: 15,
    padding: 16,
    flexDirection: "row",
    gap: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },
  addText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 19,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: C.border,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  label: {
    color: C.text,
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: C.text,
    marginBottom: 17,
  },
  saveButton: {
    backgroundColor: C.navy,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveText: {
    color: "white",
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    marginBottom: 15,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EAF1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: C.text,
    fontWeight: "700",
    fontSize: 16,
  },
  year: {
    color: C.muted,
    fontSize: 12,
    marginTop: 5,
  },
  cardActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  editButton: {
    flex: 1,
    padding: 11,
    backgroundColor: "#EEF3FF",
    borderRadius: 11,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
  editText: {
    color: C.blue,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    padding: 11,
    backgroundColor: "#FFF0F1",
    borderRadius: 11,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
  deleteText: {
    color: "#DC3545",
    fontWeight: "600",
  },
  empty: {
    padding: 35,
    borderRadius: 18,
    backgroundColor: C.white,
    alignItems: "center",
    gap: 9,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    color: C.muted,
    fontSize: 12,
    textAlign: "center",
  },
});
