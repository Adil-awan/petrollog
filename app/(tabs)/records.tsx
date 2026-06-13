import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Animated,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '../../src/theme/colors';
import {
  getAllPurchases, getPurchasesByMonth, getPurchasesByWeek,
  deletePurchase, Purchase,
} from '../../src/db/database';
import {
  formatPKR, formatLiters, formatDate, currentMonth,
  previousMonth, nextMonth, isCurrentMonth, formatMonthLabel,
} from '../../src/utils/helpers';

type FilterMode = 'all' | 'month' | 'week';

function PurchaseRow({ item, onEdit, onDelete }: {
  item: Purchase;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
        <Text style={styles.rowTime}>{item.time}</Text>
        {item.notes ? <Text style={styles.rowNotes} numberOfLines={1}>{item.notes}</Text> : null}
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.rowLiters}>{formatLiters(item.liters)}</Text>
        <Text style={styles.rowPPL}>₨ {item.price_per_liter.toFixed(1)}/L</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowTotal}>{formatPKR(item.total_cost)}</Text>
        <View style={styles.rowActions}>
          <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.7}>
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.7}>
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function RecordsScreen() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [search, setSearch] = useState('');

  const loadData = useCallback(() => {
    let data: Purchase[] = [];
    if (filterMode === 'all') {
      data = getAllPurchases();
    } else if (filterMode === 'month') {
      data = getPurchasesByMonth(selectedMonth);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff)).toISOString().slice(0, 10);
      const weekEnd = new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + 6)).toISOString().slice(0, 10);
      data = getPurchasesByWeek(weekStart, weekEnd);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter(
        (p) => p.date.includes(s) || (p.notes ?? '').toLowerCase().includes(s)
      );
    }
    setPurchases(data);
  }, [filterMode, selectedMonth, search]);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  const handleDelete = (id: number) => {
    Alert.alert('Delete Record', 'Are you sure you want to delete this record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => { deletePurchase(id); loadData(); },
      },
    ]);
  };

  const totalLiters = purchases.reduce((s, p) => s + p.liters, 0);
  const totalCost = purchases.reduce((s, p) => s + p.total_cost, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Records 📋</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-record')} activeOpacity={0.7}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by date or notes..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: Colors.textMuted, fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['week', 'month', 'all'] as FilterMode[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filterMode === f && styles.filterTabActive]}
            onPress={() => setFilterMode(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterTabText, filterMode === f && styles.filterTabTextActive]}>
              {f === 'week' ? 'This Week' : f === 'month' ? 'Monthly' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Month Navigator */}
      {filterMode === 'month' && (
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setSelectedMonth(previousMonth(selectedMonth))} style={styles.monthArrow}>
            <Text style={styles.monthArrowText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{formatMonthLabel(selectedMonth)}</Text>
          <TouchableOpacity
            onPress={() => !isCurrentMonth(selectedMonth) && setSelectedMonth(nextMonth(selectedMonth))}
            style={[styles.monthArrow, isCurrentMonth(selectedMonth) && styles.monthArrowDisabled]}
          >
            <Text style={[styles.monthArrowText, isCurrentMonth(selectedMonth) && { color: Colors.textMuted }]}>›</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Summary Bar */}
      {purchases.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {purchases.length} record{purchases.length !== 1 ? 's' : ''} •{' '}
            <Text style={{ color: Colors.accent }}>{formatLiters(totalLiters)}</Text> •{' '}
            <Text style={{ color: Colors.success }}>{formatPKR(totalCost)}</Text>
          </Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {purchases.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No records found</Text>
            <Text style={styles.emptyText}>No fuel purchases for this period.</Text>
          </View>
        ) : (
          purchases.map((item) => (
            <PurchaseRow
              key={item.id}
              item={item}
              onEdit={() => router.push({ pathname: '/edit-record', params: { id: item.id } })}
              onDelete={() => handleDelete(item.id)}
            />
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  addBtnText: { color: Colors.bg, fontWeight: '700', fontSize: FontSize.sm },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card,
    borderRadius: Radius.md, marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, paddingVertical: 12 },

  filterRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.md,
    gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  filterTab: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md,
    backgroundColor: Colors.card, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  filterTabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  filterTabTextActive: { color: Colors.bg },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.lg,
  },
  monthArrow: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  monthArrowDisabled: { opacity: 0.3 },
  monthArrowText: { fontSize: 22, color: Colors.accent, fontWeight: '700' },
  monthLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '700', minWidth: 140, textAlign: 'center' },

  summaryBar: {
    marginHorizontal: Spacing.md, backgroundColor: Colors.card,
    borderRadius: Radius.sm, padding: Spacing.sm,
    marginBottom: Spacing.sm, alignItems: 'center',
  },
  summaryText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },

  list: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  row: {
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  rowLeft: { flex: 2 },
  rowDate: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '700' },
  rowTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  rowNotes: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  rowMid: { flex: 1.5, alignItems: 'center' },
  rowLiters: { fontSize: FontSize.md, color: Colors.accent, fontWeight: '800' },
  rowPPL: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  rowRight: { flex: 1.5, alignItems: 'flex-end' },
  rowTotal: { fontSize: FontSize.md, fontWeight: '800', color: Colors.success, marginBottom: 6 },
  rowActions: { flexDirection: 'row', gap: 6 },
  editBtn: {
    backgroundColor: Colors.cardAlt, borderRadius: Radius.sm,
    width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
  },
  editBtnText: { fontSize: 14 },
  deleteBtn: {
    backgroundColor: Colors.danger + '22', borderRadius: Radius.sm,
    width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 14 },

  emptyBox: { padding: Spacing.xxl, alignItems: 'center', marginTop: Spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
});
