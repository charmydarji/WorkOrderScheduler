import { TimelineModel, Timescale, TimelineColumn } from '../models/models';
import {
  addDays,
  addHours,
  diffInDays,
  formatDayLabel,
  formatHourLabel,
  formatMonthLabel,
  formatWeekLabel,
  startOfDay,
} from './date.utils';

function buildMonthColumns(rangeStart: Date, rangeEnd: Date): TimelineColumn[] {
  const cols: TimelineColumn[] = [];
  const start = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);

  let s = new Date(start);

  while (s < end) {
    const e = new Date(s.getFullYear(), s.getMonth() + 1, 1);
    cols.push({
      start: new Date(s),
      end: e,
      label: formatMonthLabel(s),
    });
    s = e;
  }

  return cols;
}

function buildDayColumns(rangeStart: Date, daysCount: number): TimelineColumn[] {
  const cols: TimelineColumn[] = [];

  for (let i = 0; i < daysCount; i++) {
    const s = addDays(rangeStart, i);
    const e = addDays(rangeStart, i + 1);

    cols.push({
      start: s,
      end: e,
      label: formatDayLabel(s),
    });
  }

  return cols;
}

function buildWeekColumns(rangeStart: Date, weeksCount: number): TimelineColumn[] {
  const cols: TimelineColumn[] = [];

  for (let i = 0; i < weeksCount; i++) {
    const s = addDays(rangeStart, i * 7);
    const e = addDays(rangeStart, (i + 1) * 7);

    cols.push({
      start: s,
      end: e,
      label: formatWeekLabel(s, addDays(e, -1)),
    });
  }

  return cols;
}

function buildHourColumns(rangeStart: Date, hoursCount: number): TimelineColumn[] {
  const cols: TimelineColumn[] = [];

  for (let i = 0; i < hoursCount; i++) {
    const s = addHours(rangeStart, i);
    const e = addHours(rangeStart, i + 1);

    cols.push({
      start: s,
      end: e,
      label: formatHourLabel(s, true),
    });
  }

  return cols;
}

export interface TimelineRange {
  rangeStart: Date;
  rangeEnd: Date;
}

export function getInitialRange(timescale: Timescale, today: Date): TimelineRange {
  const t = startOfDay(today);

  if (timescale === 'month') {
    const rangeStart = new Date(t.getFullYear(), t.getMonth() - 2, 1);
    const rangeEnd = new Date(t.getFullYear(), t.getMonth() + 14, 1);
    return { rangeStart, rangeEnd };
  }

  if (timescale === 'week') {
    return {
      rangeStart: addDays(t, -56),
      rangeEnd: addDays(t, 56),
    };
  }

  if (timescale === 'day') {
    return {
      rangeStart: addDays(t, -14),
      rangeEnd: addDays(t, 14),
    };
  }

  const rangeStart = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 0, 0, 0);
  return {
    rangeStart,
    rangeEnd: addHours(rangeStart, 48),
  };
}

export function extendRangeLeft(
  range: TimelineRange,
  timescale: Timescale,
  amount: number
): { newRangeStart: Date; addedWidthPx: number } {
  const pxPerDay =
    timescale === 'month' ? 18 : timescale === 'week' ? 24 : timescale === 'day' ? 56 : 60;

  const pxPerHour = 56;

  if (timescale === 'month') {
    const newStart = new Date(
      range.rangeStart.getFullYear(),
      range.rangeStart.getMonth() - amount,
      1
    );
    const colWidth = 110;
    return {
      newRangeStart: newStart,
      addedWidthPx: amount * colWidth,
    };
  }

  if (timescale === 'week') {
    const newStart = addDays(range.rangeStart, -amount * 7);
    return {
      newRangeStart: newStart,
      addedWidthPx: amount * 7 * pxPerDay,
    };
  }

  if (timescale === 'day') {
    const newStart = addDays(range.rangeStart, -amount);
    return {
      newRangeStart: newStart,
      addedWidthPx: amount * pxPerDay,
    };
  }

  const newStart = addHours(range.rangeStart, -amount);
  return {
    newRangeStart: newStart,
    addedWidthPx: amount * pxPerHour,
  };
}

export function extendRangeRight(
  range: TimelineRange,
  timescale: Timescale,
  amount: number
): Date {
  if (timescale === 'month') {
    return new Date(range.rangeEnd.getFullYear(), range.rangeEnd.getMonth() + amount, 1);
  }

  if (timescale === 'week') {
    return addDays(range.rangeEnd, amount * 7);
  }

  if (timescale === 'day') {
    return addDays(range.rangeEnd, amount);
  }

  return addHours(range.rangeEnd, amount);
}

export function buildTimelineFromRange(
  timescale: Timescale,
  range: TimelineRange
): TimelineModel {
  if (timescale === 'month') {
    const columns = buildMonthColumns(range.rangeStart, range.rangeEnd);
    const rangeEnd = columns.length > 0 ? columns[columns.length - 1].end : range.rangeEnd;

    return {
      timescale,
      rangeStart: range.rangeStart,
      rangeEnd,
      columns,
      pxPerDay: 18,
    };
  }

  if (timescale === 'week') {
    const days = diffInDays(range.rangeEnd, range.rangeStart);
    const weeks = Math.ceil(days / 7);
    const columns = buildWeekColumns(range.rangeStart, weeks);
    const rangeEnd = columns.length > 0 ? columns[columns.length - 1].end : range.rangeEnd;

    return {
      timescale,
      rangeStart: range.rangeStart,
      rangeEnd,
      columns,
      pxPerDay: 24,
    };
  }

  if (timescale === 'day') {
    const days = diffInDays(range.rangeEnd, range.rangeStart);
    const columns = buildDayColumns(range.rangeStart, days);

    return {
      timescale,
      rangeStart: range.rangeStart,
      rangeEnd: range.rangeEnd,
      columns,
      pxPerDay: 56,
    };
  }

  const hours = Math.ceil((range.rangeEnd.getTime() - range.rangeStart.getTime()) / 3600000);
  const columns = buildHourColumns(range.rangeStart, hours);
  const rangeEnd = columns.length > 0 ? columns[columns.length - 1].end : range.rangeEnd;

  return {
    timescale,
    rangeStart: range.rangeStart,
    rangeEnd,
    columns,
    pxPerDay: 60,
    pxPerHour: 56,
  };
}

export function buildTimeline(timescale: Timescale, anchor: Date): TimelineModel {
  const today = startOfDay(anchor);
  const range = getInitialRange(timescale, today);
  return buildTimelineFromRange(timescale, range);
}