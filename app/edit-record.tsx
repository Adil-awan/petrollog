import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, Radius, FontSize } from '../src/theme/colors';
import { getAllPurchases, updatePurchase, Purchase } from '../src/db/database';

export default function EditRecordScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      const all = getAllPurchases();
      const record = all.find((p) => p.id === parseInt(id));
      if (record) {
        setDate(record.date);
        setTime(record.time);
        setLiters(String(record.liters));
        setPricePerLiter(String(record.price_per_liter));
        setNotes(record.notes ?? '');
      }
    }
  }, [id]);

  const totalCost = liters && pricePerLiter
    ? (parseFloat(liters) * parseFloat(pricePerLiter)).toFixed(0)
    : null;

  const handleSave = () => {
    if (!liters || isNaN(parseFloat(liters)) || parseFloat(liters) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of liters.');
      return;
    }
    if (!pricePerLiter || isNaN(parseFloat(pricePerLiter)) || parseFloat(pricePerLiter) <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid price per liter.');
      return;
    }
    setSaving(true);
    try {
      updatePurchase(parseInt(id!), date, time, parseFloat(liters), parseFloat(pricePerLiter), notes.trim());
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to update record.');
      setSaving(false);
    }
  };

  const onDateChange = (_: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) setDate(selected.toISOString().slice(0, 10));
  };

  const onTimeChange = (_: any, selected?: Date) => {
    setShowTimePicker(false);
    if (selected) {
      const h = String(selected.getHours()).padStart(2, '0');
      const m = String(selected.getMinutes()).padStart(2, '0');
      setTime(`${h}:${m}`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.card }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Live Total Preview */}
        <View style={styles.totalPreview}>
          <Text style={styles.totalLabel}>Total Cost</Text>
          <Text style={styles.totalAmount}>
            {totalCost ? `₨ ${parseInt(totalCost).toLocaleString()}` : '₨ —'}
          </Text>
          {totalCost && (
            <Text style={styles.totalFormula}>
              {liters}L × ₨{pricePerLiter} = ₨{totalCost}
            </Text>
          )}
        </View>

        <Text style={styles.sectionLabel}>Date & Time</Text>
        <View style={styles.rowPickers}>
          <TouchableOpacity style={[styles.pickerBtn, { flex: 1.5 }]} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.pickerIcon}>📅</Text>
            <Text style={styles.pickerText}>{date}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pickerBtn, { flex: 1 }]} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.pickerIcon}>🕐</Text>
            <Text style={styles.pickerText}>{time}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && date && (
          <DateTimePicker
            value={new Date(date + 'T12:00:00')}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={onDateChange}
          />
        )}
        {showTimePicker && time && (
          <DateTimePicker
            value={new Date(`2000-01-01T${time}:00`)}
            mode="time"
            display="default"
            onChange={onTimeChange}
            is24Hour
          />
        )}

        <Text style={styles.sectionLabel}>Liters Filled</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={liters}
            onChangeText={setLiters}
            placeholder="e.g. 10.5"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
          />
          <View style={styles.inputSuffix}>
            <Text style={styles.inputSuffixText}>L</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Price per Liter (₨)</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputPrefix}>
            <Text style={styles.inputPrefixText}>₨</Text>
          </View>
          <TextInput
            style={styles.input}
            value={pricePerLiter}
            onChangeText={setPricePerLiter}
            placeholder="e.g. 290"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        <Text style={styles.sectionLabel}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Filled up before road trip"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : '✓  Update Record'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.md },
  totalPreview: {
    backgroundColor: Colors.accent + '18',
    borderRadius: Radius.xl, padding: Spacing.lg,
    alignItems: 'center', marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.accent + '40',
  },
  totalLabel: { fontSize: FontSize.sm, color: Colors.accentLight, fontWeight: '600', marginBottom: 4 },
  totalAmount: { fontSize: 42, fontWeight: '800', color: Colors.accent },
  totalFormula: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },

  sectionLabel: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary,
    marginBottom: Spacing.xs, marginTop: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  rowPickers: { flexDirection: 'row', gap: Spacing.sm },
  pickerBtn: {
    backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  pickerIcon: { fontSize: 18 },
  pickerText: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '600' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  input: {
    flex: 1, color: Colors.textPrimary, fontSize: FontSize.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, fontWeight: '600',
  },
  textArea: {
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    minHeight: 80, textAlignVertical: 'top', paddingTop: Spacing.md,
  },
  inputSuffix: {
    backgroundColor: Colors.cardAlt, paddingHorizontal: Spacing.md,
    height: '100%', alignItems: 'center', justifyContent: 'center', minHeight: 52,
  },
  inputSuffixText: { color: Colors.accent, fontWeight: '800', fontSize: FontSize.md },
  inputPrefix: {
    backgroundColor: Colors.cardAlt, paddingHorizontal: Spacing.md,
    height: '100%', alignItems: 'center', justifyContent: 'center', minHeight: 52,
  },
  inputPrefixText: { color: Colors.accent, fontWeight: '800', fontSize: FontSize.md },

  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2, alignItems: 'center', marginTop: Spacing.xl,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.bg, fontWeight: '800', fontSize: FontSize.lg },

  cancelBtn: { paddingVertical: Spacing.md, alignItems: 'center', marginTop: Spacing.sm },
  cancelBtnText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
});
