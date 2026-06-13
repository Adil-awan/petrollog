// Utility helpers
import { Platform } from 'react-native';

export function formatPKR(amount: number): string {
  return `₨ ${amount.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatLiters(liters: number): string {
  return `${liters.toFixed(2)} L`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-PK', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' });
}

export function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const prev = new Date(y, m - 2, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

export function nextMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const next = new Date(y, m, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

export function isCurrentMonth(month: string): boolean {
  return month === currentMonth();
}

export function getWeekRangeForDate(dateStr: string): { start: string; end: string } {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay(); // 0=Sun
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Mon
  const start = new Date(date.setDate(diff));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function getLast4Weeks(): { label: string; start: string; end: string }[] {
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const range = getWeekRangeForDate(d.toISOString().slice(0, 10));
    weeks.push({ label: `W${4 - i}`, ...range });
  }
  return weeks;
}
