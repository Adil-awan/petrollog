import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { Colors, Spacing, Radius, FontSize } from '../../src/theme/colors';
import {
  getMonthlyStats, getWeeklyStatsForMonth, getPriceTrendForMonth, getPurchasesByWeek,
} from '../../src/db/database';
import {
  formatPKR, formatLiters, formatMonthLabel, currentMonth,
  previousMonth, nextMonth, isCurrentMonth, getLast4Weeks, formatDateShort,
} from '../../src/utils/helpers';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - Spacing.md * 2 - 32;

type ReportTab = 'weekly' | 'monthly';

export default function ReportsScreen() {
  const [tab, setTab] = useState<ReportTab>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [monthStats, setMonthStats] = useState({ totalLiters: 0, totalCost: 0, avgPrice: 0, count: 0 });
  const [weeklyData, setWeeklyData] = useState<{ label: string; value: number; frontColor: string }[]>([]);
  const [priceData, setPriceData] = useState<{ value: number; label: string }[]>([]);
  const [weeklyBreakdown, setWeeklyBreakdown] = useState<{ label: string; liters: number; cost: number }[]>([]);

  const loadMonthlyData = useCallback(() => {
    const stats = getMonthlyStats(selectedMonth);
    setMonthStats(stats);

    const weeks = getWeeklyStatsForMonth(selectedMonth);
    setWeeklyData(
      weeks.map((w, i) => ({
        label: `W${i + 1}`,
        value: Math.round(w.totalCost),
        frontColor: Colors.accent,
      }))
    );

    const prices = getPriceTrendForMonth(selectedMonth);
    setPriceData(
      prices.map((p) => ({
        value: p.price_per_liter,
        label: formatDateShort(p.date),
      }))
    );
  }, [selectedMonth]);

  const loadWeeklyData = useCallback(() => {
    const weeks = getLast4Weeks();
    const breakdown = weeks.map((w) => {
      const records = getPurchasesByWeek(w.start, w.end);
      return {
        label: `${formatDateShort(w.start)}`,
        liters: records.reduce((s, r) => s + r.liters, 0),
        cost: records.reduce((s, r) => s + r.total_cost, 0),
      };
    });
    setWeeklyBreakdown(breakdown);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMonthlyData();
      loadWeeklyData();
    }, [loadMonthlyData, loadWeeklyData])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports 📊</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['monthly', 'weekly'] as ReportTab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === 'monthly' ? '📅 Monthly' : '🗓️ Weekly'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {tab === 'monthly' ? (
          <>
            {/* Month Navigator */}
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

            {/* Monthly Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { borderTopColor: Colors.accent }]}>
                <Text style={styles.summaryCardLabel}>Total Liters</Text>
                <Text style={[styles.summaryCardValue, { color: Colors.accent }]}>{formatLiters(monthStats.totalLiters)}</Text>
              </View>
              <View style={[styles.summaryCard, { borderTopColor: Colors.success }]}>
                <Text style={styles.summaryCardLabel}>Total Cost</Text>
                <Text style={[styles.summaryCardValue, { color: Colors.success }]}>{formatPKR(monthStats.totalCost)}</Text>
              </View>
              <View style={[styles.summaryCard, { borderTopColor: Colors.accentLight }]}>
                <Text style={styles.summaryCardLabel}>Avg ₨/Liter</Text>
                <Text style={[styles.summaryCardValue, { color: Colors.accentLight }]}>₨ {monthStats.avgPrice.toFixed(0)}</Text>
              </View>
              <View style={[styles.summaryCard, { borderTopColor: Colors.textMuted }]}>
                <Text style={styles.summaryCardLabel}>Fill-ups</Text>
                <Text style={styles.summaryCardValue}>{monthStats.count}</Text>
              </View>
            </View>

            {/* Weekly Cost Bar Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>💰 Cost by Week</Text>
              {weeklyData.length > 0 ? (
                <BarChart
                  data={weeklyData}
                  width={CHART_WIDTH}
                  height={180}
                  barWidth={36}
                  spacing={20}
                  roundedTop
                  noOfSections={4}
                  barBorderRadius={6}
                  yAxisTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 11, fontWeight: '600' }}
                  yAxisColor={Colors.border}
                  xAxisColor={Colors.border}
                  rulesColor={Colors.border}
                  labelWidth={40}
                  isAnimated
                />
              ) : (
                <View style={styles.noDataBox}>
                  <Text style={styles.noDataText}>No data for this month yet</Text>
                </View>
              )}
            </View>

            {/* Price Trend Line Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>📈 Price per Liter Trend</Text>
              {priceData.length > 1 ? (
                <LineChart
                  data={priceData}
                  width={CHART_WIDTH}
                  height={160}
                  color={Colors.accent}
                  thickness={3}
                  noOfSections={4}
                  areaChart
                  startFillColor={Colors.accent + '55'}
                  endFillColor={Colors.accent + '05'}
                  curved
                  yAxisTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 9, fontWeight: '600' }}
                  yAxisColor={Colors.border}
                  xAxisColor={Colors.border}
                  rulesColor={Colors.border}
                  dataPointsColor={Colors.accentLight}
                  isAnimated
                  hideDataPoints={priceData.length > 10}
                  rotateLabel
                  labelsExtraHeight={30}
                />
              ) : priceData.length === 1 ? (
                <View style={styles.noDataBox}>
                  <Text style={styles.noDataText}>₨ {priceData[0].value.toFixed(1)}/L — add more records to see trend</Text>
                </View>
              ) : (
                <View style={styles.noDataBox}>
                  <Text style={styles.noDataText}>No records yet for this month</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Last 4 Weeks Breakdown</Text>
            {weeklyBreakdown.map((w, i) => (
              <View key={i} style={styles.weekRow}>
                <View style={styles.weekMeta}>
                  <Text style={styles.weekLabel}>Week {i + 1}</Text>
                  <Text style={styles.weekDate}>{w.label}</Text>
                </View>
                <View style={styles.weekStats}>
                  <Text style={styles.weekLiters}>{formatLiters(w.liters)}</Text>
                  <Text style={styles.weekCost}>{formatPKR(w.cost)}</Text>
                </View>
              </View>
            ))}

            {/* Weekly Bar Chart */}
            {weeklyBreakdown.some((w) => w.cost > 0) && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>⛽ Liters per Week (Last 4)</Text>
                <BarChart
                  data={weeklyBreakdown.map((w, i) => ({
                    label: `W${i + 1}`,
                    value: Math.round(w.liters * 10) / 10,
                    frontColor: Colors.accent,
                  }))}
                  width={CHART_WIDTH}
                  height={180}
                  barWidth={50}
                  spacing={20}
                  roundedTop
                  noOfSections={4}
                  barBorderRadius={6}
                  yAxisTextStyle={{ color: Colors.textMuted, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 12, fontWeight: '700' }}
                  yAxisColor={Colors.border}
                  xAxisColor={Colors.border}
                  rulesColor={Colors.border}
                  isAnimated
                />
              </View>
            )}
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  scroll: { paddingHorizontal: Spacing.md },

  tabRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.md,
    gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  tabBtn: {
    flex: 1, paddingVertical: Spacing.sm + 2, borderRadius: Radius.md,
    backgroundColor: Colors.card, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  tabBtnActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700' },
  tabBtnTextActive: { color: Colors.bg },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md, gap: Spacing.lg,
  },
  monthArrow: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  monthArrowDisabled: { opacity: 0.3 },
  monthArrowText: { fontSize: 22, color: Colors.accent, fontWeight: '700' },
  monthLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '700', minWidth: 140, textAlign: 'center' },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: {
    flex: 1, minWidth: (width - Spacing.md * 2 - Spacing.sm) / 2 - 1,
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, borderTopWidth: 3,
  },
  summaryCardLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  summaryCardValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },

  chartCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md, overflow: 'hidden',
  },
  chartTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },

  noDataBox: { paddingVertical: Spacing.xl, alignItems: 'center' },
  noDataText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },

  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  weekRow: {
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  weekMeta: {},
  weekLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  weekDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  weekStats: { alignItems: 'flex-end' },
  weekLiters: { fontSize: FontSize.md, fontWeight: '700', color: Colors.accent },
  weekCost: { fontSize: FontSize.sm, color: Colors.success, fontWeight: '600', marginTop: 2 },
});
