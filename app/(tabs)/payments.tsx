import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Colors, Spacing, Radius, FontSize } from '../../src/theme/colors';
import {
  getAllPayments, getUnpaidBalance, markMonthAsPaid, getMonthlyStats, Payment,
} from '../../src/db/database';
import {
  formatPKR, formatMonthLabel, currentMonth, todayISO, previousMonth,
} from '../../src/utils/helpers';

async function scheduleMonthlyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⛽ PetroLog — Payment Reminder',
      body: 'Your monthly petrol balance is due! Open PetroLog to review.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: 28,
      hour: 10,
      minute: 0,
    },
  });
}

export default function PaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [unpaidBalance, setUnpaidBalance] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const month = currentMonth();

  const loadData = useCallback(() => {
    setUnpaidBalance(getUnpaidBalance());
    setPayments(getAllPayments());
  }, []);

  useFocusEffect(
    useCallback(() => { loadData(); }, [loadData])
  );

  const handleMarkPaid = async () => {
    const stats = getMonthlyStats(month);
    if (stats.totalCost === 0) {
      Alert.alert('Nothing to pay', 'There are no expenses recorded for this month.');
      return;
    }
    Alert.alert(
      'Mark as Paid',
      `Mark ${formatMonthLabel(month)} (${formatPKR(unpaidBalance)}) as fully paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid ✓',
          onPress: () => {
            markMonthAsPaid(month, unpaidBalance, todayISO());
            loadData();
            Alert.alert('✅ Paid!', `${formatMonthLabel(month)} marked as paid.`);
          },
        },
      ]
    );
  };

  const toggleReminder = async (val: boolean) => {
    if (val) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow notifications to enable reminders.');
        return;
      }
      await scheduleMonthlyReminder();
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    setReminderEnabled(val);
  };

  const isCurrentMonthPaid = payments.some((p) => p.month === month && p.status === 'paid');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments 💳</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Balance Card */}
        <View style={[styles.balanceCard, { borderColor: unpaidBalance > 0 ? Colors.danger + '60' : Colors.success + '60' }]}>
          <Text style={styles.balanceLabel}>Total Outstanding Balance</Text>
          <Text style={[styles.balanceAmount, { color: unpaidBalance > 0 ? Colors.danger : Colors.success }]}>
            {formatPKR(unpaidBalance)}
          </Text>
          <Text style={styles.balanceSub}>
            {unpaidBalance > 0 ? '⚠️  Amount owed to petrol pump' : '✅  All cleared — you\'re up to date!'}
          </Text>
        </View>

        {/* Current Month */}
        <View style={styles.currentMonthCard}>
          <View style={styles.currentMonthTop}>
            <View>
              <Text style={styles.currentMonthTitle}>{formatMonthLabel(month)}</Text>
              <Text style={styles.currentMonthSub}>Current Month</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isCurrentMonthPaid ? Colors.success + '22' : Colors.danger + '22' }
            ]}>
              <Text style={[styles.statusBadgeText, { color: isCurrentMonthPaid ? Colors.success : Colors.danger }]}>
                {isCurrentMonthPaid ? '✓ PAID' : 'UNPAID'}
              </Text>
            </View>
          </View>

          {!isCurrentMonthPaid && (
            <TouchableOpacity style={styles.markPaidBtn} onPress={handleMarkPaid} activeOpacity={0.85}>
              <Text style={styles.markPaidBtnText}>✓  Mark as Paid</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reminder Toggle */}
        <View style={styles.reminderCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderTitle}>🔔 Monthly Reminder</Text>
            <Text style={styles.reminderSub}>Remind me on the 28th of each month</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={toggleReminder}
            trackColor={{ false: Colors.border, true: Colors.accent + '66' }}
            thumbColor={reminderEnabled ? Colors.accent : Colors.textMuted}
          />
        </View>

        {/* Payment History */}
        <Text style={styles.sectionTitle}>Payment History</Text>
        {payments.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyText}>No payment records yet</Text>
          </View>
        ) : (
          payments.map((p) => (
            <View key={p.id} style={styles.paymentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentMonth}>{formatMonthLabel(p.month)}</Text>
                {p.paid_on && (
                  <Text style={styles.paymentDate}>Paid on {p.paid_on}</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[styles.paymentAmount, { color: p.status === 'paid' ? Colors.success : Colors.danger }]}>
                  {formatPKR(p.amount_paid)}
                </Text>
                <View style={[
                  styles.paymentBadge,
                  { backgroundColor: p.status === 'paid' ? Colors.success + '22' : Colors.danger + '22' }
                ]}>
                  <Text style={[styles.paymentBadgeText, { color: p.status === 'paid' ? Colors.success : Colors.danger }]}>
                    {p.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))
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

  balanceCard: {
    borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1.5, marginBottom: Spacing.md,
    backgroundColor: Colors.card,
  },
  balanceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: 4 },
  balanceAmount: { fontSize: 42, fontWeight: '800', marginBottom: 8 },
  balanceSub: { fontSize: FontSize.sm, color: Colors.textSecondary },

  currentMonthCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  currentMonthTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  currentMonthTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  currentMonthSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusBadgeText: { fontSize: FontSize.xs, fontWeight: '800' },

  markPaidBtn: {
    backgroundColor: Colors.success, borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2, alignItems: 'center',
  },
  markPaidBtnText: { color: Colors.white, fontWeight: '800', fontSize: FontSize.md },

  reminderCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  reminderTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  reminderSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  paymentRow: {
    backgroundColor: Colors.card, borderRadius: Radius.md, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm,
  },
  paymentMonth: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  paymentDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  paymentAmount: { fontSize: FontSize.lg, fontWeight: '800' },
  paymentBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full },
  paymentBadgeText: { fontSize: FontSize.xs, fontWeight: '800' },

  emptyBox: { padding: Spacing.xl, alignItems: 'center' },
  emptyIcon: { fontSize: 36, marginBottom: Spacing.sm },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
