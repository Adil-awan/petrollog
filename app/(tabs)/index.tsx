import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '../../src/theme/colors';
import {
  getMonthlyStats, getUnpaidBalance, getAllPurchases, getCurrentMonthBalance,
  Purchase,
} from '../../src/db/database';
import { formatPKR, formatLiters, formatDate, formatMonthLabel, currentMonth } from '../../src/utils/helpers';

const { width } = Dimensions.get('window');

function StatCard({
  label, value, sub, color, icon,
}: {
  label: string; value: string; sub?: string; color?: string; icon: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color ?? Colors.accent }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
        {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
      </View>
    </View>
  );
}

function RecentItem({ item, onPress }: { item: Purchase; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.recentItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.recentLeft}>
        <Text style={styles.recentDate}>{formatDate(item.date)}</Text>
        <Text style={styles.recentTime}>{item.time}</Text>
      </View>
      <View style={styles.recentMid}>
        <Text style={styles.recentLiters}>{formatLiters(item.liters)}</Text>
        <Text style={styles.recentPrice}>₨ {item.price_per_liter}/L</Text>
      </View>
      <View style={styles.recentRight}>
        <Text style={styles.recentTotal}>{formatPKR(item.total_cost)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalLiters: 0, totalCost: 0, avgPrice: 0, count: 0 });
  const [unpaidBalance, setUnpaidBalance] = useState(0);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const month = currentMonth();

  const loadData = useCallback(() => {
    const s = getMonthlyStats(month);
    setStats(s);
    setUnpaidBalance(getUnpaidBalance());
    const all = getAllPurchases();
    setRecentPurchases(all.slice(0, 5));
  }, [month]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }).start();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning! 🌅';
    if (h < 17) return 'Good Afternoon! ☀️';
    return 'Good Evening! 🌙';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.headerSub}>{formatMonthLabel(month)}</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={() => router.push('/export')} activeOpacity={0.7}>
            <Text style={styles.exportBtnText}>📤</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Balance Hero */}
        <Animated.View style={[styles.balanceCard, { opacity: fadeAnim }]}>
          <Text style={styles.balanceLabel}>Total Balance Owed</Text>
          <Text style={styles.balanceAmount}>{formatPKR(unpaidBalance)}</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceSub}>
              {unpaidBalance > 0 ? '⚠️  Payment pending' : '✅  All paid up!'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.payBtn}
            onPress={() => router.push('/(tabs)/payments')}
            activeOpacity={0.8}
          >
            <Text style={styles.payBtnText}>Manage Payments →</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* This Month Stats */}
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="⛽" label="Total Liters" value={formatLiters(stats.totalLiters)} color={Colors.accent} />
          <StatCard icon="💰" label="Total Spent" value={formatPKR(stats.totalCost)} color={Colors.success} />
          <StatCard icon="📈" label="Avg Price/Liter" value={`₨ ${stats.avgPrice.toFixed(0)}`} color={Colors.accentLight} />
          <StatCard icon="🔢" label="Fill-ups" value={`${stats.count}`} sub="times this month" />
        </View>

        {/* Recent Records */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Records</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/records')} activeOpacity={0.7}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>

        {recentPurchases.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>⛽</Text>
            <Text style={styles.emptyTitle}>No records yet</Text>
            <Text style={styles.emptyText}>Tap the + button below to add your first fuel record</Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recentPurchases.map((item) => (
              <RecentItem
                key={item.id}
                item={item}
                onPress={() => router.push(`/(tabs)/records`)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/add-record')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  greeting: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  exportBtn: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
  exportBtnText: { fontSize: 20 },

  balanceCard: {
    backgroundColor: Colors.accent + '18',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  balanceLabel: { fontSize: FontSize.sm, color: Colors.accentLight, fontWeight: '600', marginBottom: 4 },
  balanceAmount: { fontSize: FontSize.huge, fontWeight: '800', color: Colors.accent, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  balanceSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  payBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  payBtnText: { color: Colors.bg, fontWeight: '700', fontSize: FontSize.sm },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  seeAll: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: '600' },

  statsGrid: { gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
    borderLeftWidth: 3, gap: Spacing.sm,
  },
  statIcon: { fontSize: 22 },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  statSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },

  recentList: { gap: Spacing.sm },
  recentItem: {
    backgroundColor: Colors.card, borderRadius: Radius.md,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
  },
  recentLeft: { flex: 2 },
  recentDate: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
  recentTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  recentMid: { flex: 1.5, alignItems: 'center' },
  recentLiters: { fontSize: FontSize.md, color: Colors.accent, fontWeight: '700' },
  recentPrice: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  recentRight: { flex: 1.5, alignItems: 'flex-end' },
  recentTotal: { fontSize: FontSize.md, fontWeight: '800', color: Colors.success },

  emptyBox: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: Spacing.xxl, alignItems: 'center', marginTop: Spacing.md,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  fab: {
    position: 'absolute', bottom: 90, right: Spacing.lg,
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 12,
  },
  fabText: { fontSize: 32, color: Colors.bg, fontWeight: '300', lineHeight: 36, marginTop: -2 },
});
