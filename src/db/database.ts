// Database helper — SQLite via expo-sqlite
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('petrolog.db');

export function initDB() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      liters REAL NOT NULL,
      price_per_liter REAL NOT NULL,
      total_cost REAL NOT NULL,
      notes TEXT,
      is_paid INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL UNIQUE,
      amount_paid REAL NOT NULL DEFAULT 0,
      paid_on TEXT,
      status TEXT NOT NULL DEFAULT 'unpaid'
    );
  `);
}

// ─── Purchases ───────────────────────────────────────────────

export interface Purchase {
  id: number;
  date: string;
  time: string;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  notes?: string;
  is_paid: number;
  created_at: string;
}

export function addPurchase(
  date: string,
  time: string,
  liters: number,
  price_per_liter: number,
  notes: string = ''
): number {
  const total_cost = liters * price_per_liter;
  const result = db.runSync(
    `INSERT INTO purchases (date, time, liters, price_per_liter, total_cost, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    date, time, liters, price_per_liter, total_cost, notes
  );
  return result.lastInsertRowId;
}

export function updatePurchase(
  id: number,
  date: string,
  time: string,
  liters: number,
  price_per_liter: number,
  notes: string = ''
): void {
  const total_cost = liters * price_per_liter;
  db.runSync(
    `UPDATE purchases SET date=?, time=?, liters=?, price_per_liter=?, total_cost=?, notes=? WHERE id=?`,
    date, time, liters, price_per_liter, total_cost, notes, id
  );
}

export function deletePurchase(id: number): void {
  db.runSync(`DELETE FROM purchases WHERE id=?`, id);
}

export function getAllPurchases(): Purchase[] {
  return db.getAllSync<Purchase>(`SELECT * FROM purchases ORDER BY date DESC, time DESC`);
}

export function getPurchasesByMonth(month: string): Purchase[] {
  // month format: YYYY-MM
  return db.getAllSync<Purchase>(
    `SELECT * FROM purchases WHERE strftime('%Y-%m', date) = ? ORDER BY date DESC, time DESC`,
    month
  );
}

export function getPurchasesByWeek(weekStart: string, weekEnd: string): Purchase[] {
  return db.getAllSync<Purchase>(
    `SELECT * FROM purchases WHERE date >= ? AND date <= ? ORDER BY date DESC`,
    weekStart, weekEnd
  );
}

export function getPurchasesByDateRange(startDate: string, endDate: string): Purchase[] {
  return db.getAllSync<Purchase>(
    `SELECT * FROM purchases WHERE date >= ? AND date <= ? ORDER BY date DESC`,
    startDate, endDate
  );
}

export function getMonthlyStats(month: string): {
  totalLiters: number;
  totalCost: number;
  avgPrice: number;
  count: number;
} {
  const row = db.getFirstSync<{
    totalLiters: number;
    totalCost: number;
    avgPrice: number;
    count: number;
  }>(
    `SELECT 
      COALESCE(SUM(liters), 0) as totalLiters,
      COALESCE(SUM(total_cost), 0) as totalCost,
      COALESCE(AVG(price_per_liter), 0) as avgPrice,
      COUNT(*) as count
     FROM purchases WHERE strftime('%Y-%m', date) = ?`,
    month
  );
  return row ?? { totalLiters: 0, totalCost: 0, avgPrice: 0, count: 0 };
}

export function getWeeklyStatsForMonth(month: string): {
  week: string;
  totalLiters: number;
  totalCost: number;
}[] {
  return db.getAllSync(
    `SELECT 
      strftime('%W', date) as week,
      SUM(liters) as totalLiters,
      SUM(total_cost) as totalCost
     FROM purchases 
     WHERE strftime('%Y-%m', date) = ?
     GROUP BY strftime('%W', date)
     ORDER BY week ASC`,
    month
  ) as any;
}

export function getPriceTrendForMonth(month: string): { date: string; price_per_liter: number }[] {
  return db.getAllSync<{ date: string; price_per_liter: number }>(
    `SELECT date, price_per_liter FROM purchases WHERE strftime('%Y-%m', date) = ? ORDER BY date ASC`,
    month
  );
}

// ─── Payments ────────────────────────────────────────────────

export interface Payment {
  id: number;
  month: string;
  amount_paid: number;
  paid_on: string | null;
  status: string;
}

export function getOrCreatePayment(month: string): Payment {
  let row = db.getFirstSync<Payment>(`SELECT * FROM payments WHERE month = ?`, month);
  if (!row) {
    const totalCost = (db.getFirstSync<{ total: number }>(
      `SELECT COALESCE(SUM(total_cost), 0) as total FROM purchases WHERE strftime('%Y-%m', date) = ?`,
      month
    )?.total) ?? 0;
    db.runSync(
      `INSERT INTO payments (month, amount_paid, status) VALUES (?, ?, 'unpaid')`,
      month, totalCost
    );
    row = db.getFirstSync<Payment>(`SELECT * FROM payments WHERE month = ?`, month)!;
  }
  return row;
}

export function markMonthAsPaid(month: string, amountPaid: number, paidOn: string): void {
  db.runSync(
    `INSERT INTO payments (month, amount_paid, paid_on, status) VALUES (?, ?, ?, 'paid')
     ON CONFLICT(month) DO UPDATE SET amount_paid=?, paid_on=?, status='paid'`,
    month, amountPaid, paidOn, amountPaid, paidOn
  );
}

export function getAllPayments(): Payment[] {
  return db.getAllSync<Payment>(`SELECT * FROM payments ORDER BY month DESC`);
}

export function getUnpaidBalance(): number {
  const row = db.getFirstSync<{ balance: number }>(
    `SELECT COALESCE(SUM(p.total_cost), 0) as balance
     FROM purchases p
     WHERE strftime('%Y-%m', p.date) NOT IN (SELECT month FROM payments WHERE status='paid')`
  );
  return row?.balance ?? 0;
}

export function getCurrentMonthBalance(): number {
  const month = new Date().toISOString().slice(0, 7);
  const row = db.getFirstSync<{ total: number }>(
    `SELECT COALESCE(SUM(total_cost), 0) as total FROM purchases WHERE strftime('%Y-%m', date) = ?`,
    month
  );
  return row?.total ?? 0;
}
