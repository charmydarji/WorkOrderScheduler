export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}


export function addHours(d: Date, hours: number): Date {
  const x = new Date(d);
  x.setHours(x.getHours() + hours);
  return x;
}

export function diffInDays(a: Date, b: Date): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.floor(ms / 86400000);
}

export function diffInHours(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / 3600000);
}

export function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function fromIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

import type { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

export function isoToNgbDate(iso: string): NgbDateStruct | null {
  if (!iso || iso.length < 10) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { year: y, month: m, day: d };
}

export function ngbDateToIso(ngb: NgbDateStruct | null): string {
  if (!ngb) return '';
  const mm = String(ngb.month).padStart(2, '0');
  const dd = String(ngb.day).padStart(2, '0');
  return `${ngb.year}-${mm}-${dd}`;
}

export function formatMonthLabel(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export function formatDayLabel(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short', day: '2-digit' });
}

export function formatWeekLabel(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  const end = endDate.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  return `${start} – ${end}`;
}

export function formatHourLabel(d: Date, showDateAtMidnight = false): string {
  const h = d.getHours();
  let time: string;
  if (h === 0) time = '12 AM';
  else if (h < 12) time = `${h} AM`;
  else if (h === 12) time = '12 PM';
  else time = `${h - 12} PM`;
  if (showDateAtMidnight && h === 0) {
    const datePart = d.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    return `${datePart} ${time}`;
  }
  return time;
}