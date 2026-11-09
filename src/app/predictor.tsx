import { router, useFocusEffect } from "expo-router";
import {
    AlertCircle,
    BookOpen,
    Calculator,
    CheckCircle2,
    ChevronDown,
    Info,
    Target,
} from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { getSubjects, type Subject } from "../database/subject";

import { calculateICA, getICARecords, type ICARecord } from "../database/ica";

const C = {
  navy: "#142D60",
  blue: "#3164D6",
  background: "#F5F7FC",
  white: "#FFFFFF",
  text: "#17233B",
  muted: "#718096",
  border: "#E6EBF3",
  green: "#218352",
  red: "#DC3545",
};

export default function PredictorScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<ICARecord[]>([]);

  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [target, setTarget] = useState("75");
  const [showSubjects, setShowSubjects] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [subjectRows, icaRows] = await Promise.all([
        getSubjects(),
        getICARecords(),
      ]);

      setSubjects(subjectRows);
      setRecords(icaRows);

      setSubjectId((current) => {
        if (current !== null && subjectRows.some((s) => s.id === current)) {
          return current;
        }

        return subjectRows[0]?.id ?? null;
      });
    } catch (err) {
      console.error("Predictor load error:", err);
      setError("Unable to load academic records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const selectedSubject = subjects.find((s) => s.id === subjectId);

  const savedICA = records.find((r) => r.subject_id === subjectId);

  const calculation = useMemo(() => {
    if (!selectedSubject || !savedICA) {
      return null;
    }

    return calculateICA(
      [savedICA.ica1, savedICA.ica2, savedICA.ica3],
      selectedSubject.type,
    );
  }, [selectedSubject, savedICA]);

  const targetMark = target.trim() === "" ? NaN : Number(target);

  const validTarget =
    Number.isFinite(targetMark) && targetMark >= 0 && targetMark <= 100;

  const finalWeight = calculation ? 100 - calculation.weight : 0;

  const requiredMark =
    calculation && validTarget
      ? ((targetMark - calculation.contribution) / finalWeight) * 100
      : null;

  const maxOverall =
    calculation !== null ? calculation.contribution + finalWeight : null;

  let status: "achievable" | "already" | "impossible" | null = null;

  if (requiredMark !== null) {
    if (requiredMark > 100 + 1e-9) {
      status = "impossible";
    } else if (requiredMark <= 0) {
      status = "already";
    } else {
      status = "achievable";
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.blue} />
        <Text style={styles.muted}>Loading predictor...</Text>
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
      <Text style={styles.eyebrow}>ACADEMIC TOOLS</Text>
      <Text style={styles.heading}>Final Exam Predictor</Text>
      <Text style={styles.subtitle}>
        Discover the final exam mark you need to reach your target overall mark.
      </Text>

      <View style={styles.hero}>
        <Target size={29} color="#CFE0FF" />
        <Text style={styles.heroTitle}>Plan your final exam</Text>
        <Text style={styles.heroText}>
          Your saved ICA marks help calculate a realistic final exam target.
        </Text>
      </View>

      {error !== "" && (
        <View style={styles.errorCard}>
          <AlertCircle size={20} color={C.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {subjects.length === 0 ? (
        <View style={styles.card}>
          <BookOpen size={28} color={C.blue} />

          <Text style={styles.cardTitle}>No subjects available</Text>

          <Text style={styles.muted}>
            Please add a subject before using this tool.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push("/subjects")}
          >
            <Text style={styles.primaryText}>Manage Subjects</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Subject</Text>

            <Pressable
              style={styles.selector}
              onPress={() => setShowSubjects((current) => !current)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.subjectName}>
                  {selectedSubject?.name ?? "Select Subject"}
                </Text>

                <Text style={styles.muted}>
                  {selectedSubject?.code} • {selectedSubject?.type}
                </Text>
              </View>

              <ChevronDown size={20} color={C.blue} />
            </Pressable>

            {showSubjects &&
              subjects.map((subject) => (
                <Pressable
                  key={subject.id}
                  style={[
                    styles.subjectOption,
                    subject.id === subjectId && styles.selectedOption,
                  ]}
                  onPress={() => {
                    setSubjectId(subject.id);
                    setShowSubjects(false);
                  }}
                >
                  <Text style={styles.subjectName}>{subject.name}</Text>

                  <Text style={styles.muted}>
                    {subject.code} • {subject.type}
                  </Text>

                  <Text style={styles.muted}>{subject.semester_name}</Text>
                </Pressable>
              ))}
          </View>

          {!savedICA ? (
            <View style={styles.notice}>
              <Info size={22} color={C.blue} />

              <View style={styles.noticeBody}>
                <Text style={styles.noticeTitle}>ICA marks required</Text>

                <Text style={styles.muted}>
                  No saved ICA marks for this subject. Add your ICA marks first.
                </Text>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => router.push("/ica")}
                >
                  <Calculator size={17} color={C.blue} />
                  <Text style={styles.secondaryText}>Open ICA Calculator</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Your ICA Performance</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.muted}>Best two ICA marks</Text>
                  <Text style={styles.infoValue}>
                    {calculation?.bestTwo.join(" + ")}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.muted}>ICA average</Text>
                  <Text style={styles.infoValue}>
                    {calculation?.average.toFixed(2)}%
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.muted}>ICA contribution</Text>
                  <Text style={styles.infoValue}>
                    {calculation?.contribution.toFixed(2)}
                    {" / "}
                    {calculation?.weight}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.muted}>Final exam weight</Text>
                  <Text style={styles.infoValue}>{finalWeight}%</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Set Your Target</Text>

                <Text style={styles.label}>Desired overall mark (%)</Text>

                <TextInput
                  style={styles.input}
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 75"
                  placeholderTextColor="#9AA7BB"
                  maxLength={6}
                />

                {!validTarget && (
                  <Text style={styles.validation}>
                    Enter a valid number from 0 to 100.
                  </Text>
                )}

                <Text style={styles.hint}>
                  Calculation updates automatically. No internet needed.
                </Text>
              </View>

              {requiredMark !== null && (
                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>
                    REQUIRED FINAL EXAM MARK
                  </Text>

                  <Text style={styles.resultValue}>
                    {Math.max(0, requiredMark).toFixed(2)}
                    <Text style={styles.percent}>%</Text>
                  </Text>

                  <View style={styles.resultDivider} />

                  {status === "impossible" ? (
                    <View style={styles.statusRow}>
                      <AlertCircle size={22} color="#FFD0D0" />

                      <Text style={styles.statusText}>
                        Target not achievable. Even 100% in the final exam is
                        insufficient.
                      </Text>
                    </View>
                  ) : status === "already" ? (
                    <View style={styles.statusRow}>
                      <CheckCircle2 size={22} color="#B7F4D2" />

                      <Text style={styles.statusText}>
                        Your ICA contribution already meets this overall target.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.statusRow}>
                      <CheckCircle2 size={22} color="#B7F4D2" />

                      <Text style={styles.statusText}>
                        Target is mathematically achievable.
                      </Text>
                    </View>
                  )}

                  <View style={styles.maximum}>
                    <Text style={styles.maximumText}>
                      Maximum possible overall mark:
                    </Text>

                    <Text style={styles.maximumValue}>
                      {maxOverall?.toFixed(2)}%
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.note}>
                <Info size={19} color={C.blue} />

                <Text style={styles.noteText}>
                  This is a weighted-mark prediction. University grade
                  boundaries, rounding rules and minimum exam requirements may
                  affect the final result.
                </Text>
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
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
  center: {
    flex: 1,
    backgroundColor: C.background,
    justifyContent: "center",
    alignItems: "center",
    gap: 14,
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
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 22,
  },
  hero: {
    backgroundColor: C.navy,
    padding: 23,
    borderRadius: 22,
    marginBottom: 18,
    gap: 10,
  },
  heroTitle: {
    color: C.white,
    fontSize: 21,
    fontWeight: "800",
  },
  heroText: {
    color: "#CEDDF8",
    fontSize: 13,
    lineHeight: 20,
  },
  card: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 18,
    marginBottom: 15,
  },
  cardTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 16,
  },
  muted: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
  },
  selector: {
    borderColor: "#BBD0F6",
    borderWidth: 1,
    borderRadius: 13,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F9FF",
  },
  subjectOption: {
    padding: 13,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 9,
    borderRadius: 11,
  },
  selectedOption: {
    backgroundColor: "#EAF1FF",
    borderColor: C.blue,
  },
  subjectName: {
    color: C.text,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
  },
  notice: {
    flexDirection: "row",
    gap: 13,
    backgroundColor: "#EAF1FF",
    borderRadius: 17,
    padding: 18,
    marginBottom: 15,
  },
  noticeBody: {
    flex: 1,
  },
  noticeTitle: {
    color: C.navy,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  secondaryText: {
    color: C.blue,
    fontWeight: "800",
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: C.blue,
    borderRadius: 13,
    padding: 14,
    alignItems: "center",
    marginTop: 18,
  },
  primaryText: {
    color: C.white,
    fontWeight: "800",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  infoValue: {
    color: C.navy,
    fontSize: 13,
    fontWeight: "800",
  },
  label: {
    color: C.text,
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    height: 55,
    borderRadius: 12,
    paddingHorizontal: 15,
    color: C.text,
    fontSize: 19,
    fontWeight: "800",
  },
  validation: {
    color: C.red,
    fontSize: 12,
    marginTop: 9,
  },
  hint: {
    color: C.muted,
    fontSize: 12,
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: C.navy,
    borderRadius: 22,
    padding: 23,
    marginBottom: 16,
  },
  resultLabel: {
    color: "#C3D5FF",
    fontWeight: "800",
    letterSpacing: 1.1,
    fontSize: 11,
  },
  resultValue: {
    color: C.white,
    fontSize: 47,
    fontWeight: "800",
    marginTop: 11,
  },
  percent: {
    fontSize: 24,
    color: "#CDDEFF",
  },
  resultDivider: {
    backgroundColor: "#416097",
    height: 1,
    marginVertical: 20,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusText: {
    flex: 1,
    color: "#F0F5FF",
    fontSize: 12,
    lineHeight: 19,
  },
  maximum: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  maximumText: {
    color: "#C3D5FF",
    fontSize: 11,
    flex: 1,
  },
  maximumValue: {
    color: C.white,
    fontWeight: "800",
    fontSize: 13,
  },
  note: {
    backgroundColor: "#EAF1FF",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    gap: 11,
  },
  noteText: {
    color: "#607394",
    fontSize: 12,
    lineHeight: 19,
    flex: 1,
  },
  errorCard: {
    backgroundColor: "#FFF0F1",
    flexDirection: "row",
    gap: 10,
    padding: 15,
    borderRadius: 13,
    marginBottom: 15,
  },
  errorText: {
    color: C.red,
    fontSize: 13,
    flex: 1,
  },
});
