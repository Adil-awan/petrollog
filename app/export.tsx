import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { utils as XLSXUtils, write as XLSXWrite } from 'xlsx';
import { Colors, Spacing, Radius, FontSize } from '../src/theme/colors';
import {
  getPurchasesByMonth, getPurchasesByDateRange, getMonthlyStats, getAllPurchases,
} from '../src/db/database';
import {
  formatPKR, formatLiters, formatMonthLabel, currentMonth,
  previousMonth, nextMonth, isCurrentMonth,
} from '../src/utils/helpers';

export default function ExportScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [loading, setLoading] = useState<'excel' | 'pdf' | null>(null);

  const getExportData = () => {
    return getPurchasesByMonth(selectedMonth);
  };

  const handleExcelExport = async () => {
    setLoading('excel');
    try {
      const records = getExportData();
      if (records.length === 0) {
        Alert.alert('No Data', 'No records found for the selected month.');
        setLoading(null);
        return;
      }

      const ws_data = [
        ['Date', 'Time', 'Liters', 'Price/Liter (₨)', 'Total Cost (₨)', 'Notes'],
        ...records.map((r) => [r.date, r.time, r.liters, r.price_per_liter, r.total_cost, r.notes ?? '']),
      ];

      const totalLiters = records.reduce((s, r) => s + r.liters, 0);
      const totalCost = records.reduce((s, r) => s + r.total_cost, 0);
      ws_data.push(['', '', '', 'TOTAL', totalCost, '']);
      ws_data.push(['', '', totalLiters, 'TOTAL LITERS', '', '']);

      const ws = XLSXUtils.aoa_to_sheet(ws_data);
      const wb = XLSXUtils.book_new();
      XLSXUtils.book_append_sheet(wb, ws, formatMonthLabel(selectedMonth));

      const wbout = XLSXWrite(wb, { type: 'base64', bookType: 'xlsx' });
      const filename = `PetroLog_${selectedMonth}.xlsx`;
      const file = new File(Paths.document, filename);
      await file.write(wbout, { encoding: 'base64' });
      const fileUri = file.uri;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: `Share ${filename}`,
        });
      } else {
        Alert.alert('Saved', `File saved to: ${fileUri}`);
      }
    } catch (e) {
      Alert.alert('Export Failed', String(e));
    } finally {
      setLoading(null);
    }
  };

  const handlePDFExport = async () => {
    setLoading('pdf');
    try {
      const records = getExportData();
      if (records.length === 0) {
        Alert.alert('No Data', 'No records found for the selected month.');
        setLoading(null);
        return;
      }

      const stats = getMonthlyStats(selectedMonth);
      const rows = records.map((r) => `
        <tr>
          <td>${r.date}</td>
          <td>${r.time}</td>
          <td>${r.liters.toFixed(2)} L</td>
          <td>₨ ${r.price_per_liter.toFixed(1)}</td>
          <td>₨ ${Math.round(r.total_cost).toLocaleString()}</td>
          <td>${r.notes ?? ''}</td>
        </tr>
      `).join('');

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8"/>
          <style>
            body { font-family: Arial, sans-serif; background: #fff; color: #222; margin: 0; padding: 20px; }
            h1 { color: #F5A623; font-size: 24px; margin-bottom: 4px; }
            h2 { color: #555; font-size: 14px; font-weight: normal; margin-bottom: 20px; }
            .summary { display: flex; gap: 16px; margin-bottom: 24px; }
            .summary-box { border: 2px solid #F5A623; border-radius: 8px; padding: 12px 20px; flex: 1; }
            .summary-box .label { font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 4px; }
            .summary-box .value { font-size: 20px; font-weight: bold; color: #333; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #F5A623; color: white; padding: 10px 8px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            tr:nth-child(even) { background: #f9f9f9; }
            .footer { margin-top: 30px; font-size: 11px; color: #aaa; text-align: center; }
          </style>
        </head>
        <body>
          <h1>⛽ PetroLog Report</h1>
          <h2>${formatMonthLabel(selectedMonth)}</h2>
          <div class="summary">
            <div class="summary-box">
              <div class="label">Total Liters</div>
              <div class="value">${stats.totalLiters.toFixed(2)} L</div>
            </div>
            <div class="summary-box">
              <div class="label">Total Cost</div>
              <div class="value">₨ ${Math.round(stats.totalCost).toLocaleString()}</div>
            </div>
            <div class="summary-box">
              <div class="label">Avg ₨/Liter</div>
              <div class="value">₨ ${stats.avgPrice.toFixed(1)}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Time</th><th>Liters</th><th>₨/Liter</th><th>Total</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">Generated by PetroLog on ${new Date().toLocaleDateString()}</div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const filename = `PetroLog_${selectedMonth}.pdf`;
      const file = new File(Paths.document, filename);
      const pdfBuffer = await (await fetch(uri)).arrayBuffer();
      file.write(new Uint8Array(pdfBuffer));
      const fileUri = file.uri;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${filename}`,
        });
      }
    } catch (e) {
      Alert.alert('Export Failed', String(e));
    } finally {
      setLoading(null);
    }
  };

  const records = getExportData();
  const stats = getMonthlyStats(selectedMonth);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Month Selector */}
        <Text style={styles.sectionLabel}>Select Month</Text>
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

        {/* Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Export Preview</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Records</Text>
            <Text style={styles.previewValue}>{records.length}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Total Liters</Text>
            <Text style={[styles.previewValue, { color: Colors.accent }]}>{formatLiters(stats.totalLiters)}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Total Cost</Text>
            <Text style={[styles.previewValue, { color: Colors.success }]}>{formatPKR(stats.totalCost)}</Text>
          </View>
          <View style={[styles.previewRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.previewLabel}>Avg Price/Liter</Text>
            <Text style={styles.previewValue}>₨ {stats.avgPrice.toFixed(1)}</Text>
          </View>
        </View>

        {/* Export Buttons */}
        <Text style={styles.sectionLabel}>Export Format</Text>

        <TouchableOpacity
          style={[styles.exportBtn, { borderColor: Colors.success }]}
          onPress={handleExcelExport}
          disabled={loading !== null}
          activeOpacity={0.85}
        >
          {loading === 'excel' ? (
            <ActivityIndicator color={Colors.success} />
          ) : (
            <>
              <Text style={styles.exportBtnIcon}>📊</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.exportBtnTitle, { color: Colors.success }]}>Export as Excel (.xlsx)</Text>
                <Text style={styles.exportBtnSub}>Open in Microsoft Excel, Google Sheets, etc.</Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.exportBtn, { borderColor: Colors.danger }]}
          onPress={handlePDFExport}
          disabled={loading !== null}
          activeOpacity={0.85}
        >
          {loading === 'pdf' ? (
            <ActivityIndicator color={Colors.danger} />
          ) : (
            <>
              <Text style={styles.exportBtnIcon}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.exportBtnTitle, { color: Colors.danger }]}>Export as PDF</Text>
                <Text style={styles.exportBtnSub}>Share a formatted PDF report</Text>
              </View>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.md },

  sectionLabel: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary,
    marginBottom: Spacing.sm, marginTop: Spacing.md,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.lg, marginBottom: Spacing.md,
    backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md,
  },
  monthArrow: {
    backgroundColor: Colors.bg, borderRadius: Radius.md,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  monthArrowDisabled: { opacity: 0.3 },
  monthArrowText: { fontSize: 22, color: Colors.accent, fontWeight: '700' },
  monthLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '700', minWidth: 140, textAlign: 'center' },

  previewCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  previewTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  previewRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  previewLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  previewValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },

  exportBtn: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    borderWidth: 1.5,
  },
  exportBtnIcon: { fontSize: 32 },
  exportBtnTitle: { fontSize: FontSize.md, fontWeight: '800', marginBottom: 2 },
  exportBtnSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
});
