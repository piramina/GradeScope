
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  Calculator,
  Check,
  Pencil,
  Trash2,
  BookOpen,
} from 'lucide-react-native';

import { getSubjects, Subject } from '../database/subject';
import {
  calculateICA,
  getICARecords,
  saveICA,
  deleteICA,
  ICARecord,
} from '../database/ica';

const C = {
  navy: '#142D60',
  blue: '#3164D6',
  bg: '#F5F7FC',
  white: '#FFFFFF',
  text: '#17233B',
  muted: '#718096',
  border: '#E6EBF3',
};

export default function ICAScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [records, setRecords] = useState<ICARecord[]>([]);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [marks, setMarks] = useState(['', '', '']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const subjectRows = await getSubjects();
      const recordRows = await getICARecords();

      setSubjects(subjectRows);
      setRecords(recordRows);

      setSubjectId((current) =>
        current !== null &&
        subjectRows.some((subject) => subject.id === current)
          ? current
          : subjectRows[0]?.id ?? null
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to load ICA data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const selectedSubject = subjects.find(
    (subject) => subject.id === subjectId
  );

  const numbers = marks.map((value) =>
    value.trim() === '' ? NaN : Number(value)
  );

  const valid =
    numbers.length === 3 &&
    numbers.every(
      (value) =>
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 100
    );

  const result =
    valid && selectedSubject
      ? calculateICA(numbers, selectedSubject.type)
      : null;

  const changeMark = (index: number, value: string) => {
    setMarks((current) =>
      current.map((mark, i) => (i === index ? value : mark))
    );
  };

  const selectSubject = (id: number) => {
    setSubjectId(id);

    const existing = records.find(
      (record) => record.subject_id === id
    );

    setMarks(
      existing
        ? [
            String(existing.ica1),
            String(existing.ica2),
            String(existing.ica3),
          ]
        : ['', '', '']
    );
  };

  const save = async () => {
    if (!selectedSubject || !valid || saving) {
      Alert.alert(
        'Invalid Marks',
        'Please select a subject and enter all three ICA marks from 0 to 100.'
      );
      return;
    }

    try {
      setSaving(true);
      await saveICA(selectedSubject.id, numbers);
      await load();
      Alert.alert('Saved', 'ICA marks saved successfully.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Unable to save ICA marks.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (record: ICARecord) => {
    Alert.alert(
      'Delete ICA Marks',
      `Delete the saved ICA marks for ${record.subject_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteICA(record.subject_id);

              if (subjectId === record.subject_id) {
                setMarks(['', '', '']);
              }

              await load();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Unable to delete ICA marks.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={C.blue} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>ACADEMIC TOOLS</Text>
      <Text style={styles.heading}>ICA Calculator</Text>
      <Text style={styles.subtitle}>
        Calculate your best two ICA marks and weighted contribution.
      </Text>

      <View style={styles.hero}>
        <Calculator size={28} color="#CFE0FF" />
        <Text style={styles.heroTitle}>Know your progress</Text>
        <Text style={styles.heroText}>
          Enter three ICA marks. Your best two will be selected automatically.
        </Text>
      </View>

      {subjects.length === 0 ? (
        <View style={styles.card}>
          <BookOpen size={28} color={C.blue} />
          <Text style={styles.title}>No subjects found</Text>
          <Text style={styles.subtitle}>
            Create a semester and add at least one subject first.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.title}>Select Subject</Text>

            {subjects.map((subject) => (
              <Pressable
                key={subject.id}
                onPress={() => selectSubject(subject.id)}
                style={[
                  styles.choice,
                  subjectId === subject.id && styles.activeChoice,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.subjectName}>
                    {subject.name}
                  </Text>
                  <Text style={styles.small}>
                    {subject.code} • {subject.semester_name}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.type,
                    subjectId === subject.id && {
                      color: C.blue,
                    },
                  ]}
                >
                  {subject.type}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Enter ICA Marks</Text>
            <Text style={styles.help}>
              Marks must be percentages between 0 and 100.
            </Text>

            <View style={styles.marksRow}>
              {marks.map((mark, index) => (
                <View key={index} style={styles.markColumn}>
                  <Text style={styles.label}>
                    ICA {index + 1}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={mark}
                    onChangeText={(value) =>
                      changeMark(index, value)
                    }
                    placeholder="0-100"
                    placeholderTextColor="#9AA7BB"
                    keyboardType="decimal-pad"
                    maxLength={6}
                    selectTextOnFocus
                  />
                </View>
              ))}
            </View>

            <Text style={styles.help}>
              {selectedSubject?.type === 'Practical'
                ? 'Practical: ICA contributes 40% to the overall mark.'
                : 'Theory: ICA contributes 30% to the overall mark.'}
            </Text>
          </View>

          {result && (
            <View style={styles.resultCard}>
              <Text style={styles.resultHeading}>
                CALCULATION RESULT
              </Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Best 2 marks</Text>
                <Text style={styles.resultText}>
                  {result.bestTwo.join(' + ')}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Average</Text>
                <Text style={styles.resultText}>
                  {result.average.toFixed(2)}%
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.resultLabel}>
                ICA Contribution
              </Text>
              <Text style={styles.bigResult}>
                {result.contribution.toFixed(2)}
                <Text style={styles.outOf}>
                  {' '} / {result.weight}
                </Text>
              </Text>
            </View>
          )}

          <Pressable
            onPress={save}
            disabled={saving}
            style={[
              styles.saveButton,
              saving && { opacity: 0.6 },
            ]}
          >
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.saveText}>
              {saving ? 'Saving...' : 'Save ICA Marks'}
            </Text>
          </Pressable>
        </>
      )}

      <Text style={styles.listHeading}>Saved ICA Records</Text>

      {records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.help}>No saved ICA records yet.</Text>
        </View>
      ) : (
        records.map((record) => {
          const calculation = calculateICA(
            [record.ica1, record.ica2, record.ica3],
            record.type
          );

          return (
            <View key={record.id} style={styles.card}>
              <Text style={styles.subjectName}>
                {record.subject_name}
              </Text>

              <Text style={styles.small}>
                {record.subject_code} • {record.type}
              </Text>

              <Text style={styles.recordMarks}>
                ICA: {record.ica1}, {record.ica2}, {record.ica3}
              </Text>

              <Text style={styles.recordResult}>
                Contribution: {calculation.contribution.toFixed(2)}
                /{calculation.weight}
              </Text>

              <View style={styles.buttonsRow}>
                <Pressable
                  style={styles.editButton}
                  onPress={() => selectSubject(record.subject_id)}
                >
                  <Pencil size={16} color={C.blue} />
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => remove(record)}
                >
                  <Trash2 size={16} color="#D63F4D" />
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  content: { padding: 20, paddingBottom: 60 },
  eyebrow: {
    fontSize: 11,
    color: C.blue,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heading: {
    color: C.text,
    fontSize: 29,
    fontWeight: '800',
  },
  subtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 18,
  },
  hero: {
    backgroundColor: C.navy,
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    gap: 9,
  },
  heroTitle: {
    color: C.white,
    fontSize: 20,
    fontWeight: '800',
  },
  heroText: {
    color: '#CDDCFA',
    lineHeight: 20,
    fontSize: 13,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 17,
    marginBottom: 15,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
    marginBottom: 14,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 13,
    marginBottom: 9,
  },
  activeChoice: {
    borderColor: C.blue,
    backgroundColor: '#EDF3FF',
  },
  subjectName: {
    color: C.text,
    fontWeight: '700',
    fontSize: 14,
  },
  small: {
    color: C.muted,
    fontSize: 11,
    marginTop: 5,
  },
  type: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
  },
  help: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 10,
  },
  marksRow: {
    flexDirection: 'row',
    gap: 9,
    marginVertical: 12,
  },
  markColumn: { flex: 1 },
  label: {
    color: C.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 51,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 11,
    paddingHorizontal: 10,
    textAlign: 'center',
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: '#EAF1FF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 17,
  },
  resultHeading: {
    fontSize: 11,
    letterSpacing: 1,
    color: C.blue,
    fontWeight: '800',
    marginBottom: 18,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  resultLabel: {
    color: '#607394',
    fontSize: 13,
  },
  resultText: {
    color: C.navy,
    fontWeight: '800',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#CBD9F1',
    marginVertical: 13,
  },
  bigResult: {
    color: C.navy,
    fontSize: 38,
    fontWeight: '800',
    marginTop: 5,
  },
  outOf: {
    color: '#607394',
    fontSize: 18,
  },
  saveButton: {
    backgroundColor: C.blue,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginBottom: 25,
  },
  saveText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '700',
  },
  listHeading: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 13,
  },
  empty: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
  },
  recordMarks: {
    color: C.muted,
    marginTop: 12,
    fontSize: 13,
  },
  recordResult: {
    color: C.blue,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 11,
    backgroundColor: '#EEF3FF',
    padding: 12,
  },
  editText: { color: C.blue, fontWeight: '700' },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 11,
    backgroundColor: '#FFF0F1',
    padding: 12,
  },
  deleteText: { color: '#D63F4D', fontWeight: '700' },
});
