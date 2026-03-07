import { Injectable } from '@angular/core';
import { NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

/** Formats dates as MM.DD.YYYY (e.g., "01.15.2026") */
@Injectable()
export class NgbDateMonthDayYearFormatter extends NgbDateParserFormatter {
  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  format(date: NgbDateStruct | null): string {
    if (!date) return '';
    return `${this.pad(date.month)}.${this.pad(date.day)}.${date.year}`;
  }

  parse(value: string): NgbDateStruct | null {
    if (!value || !value.trim()) return null;

    const trimmed = value.trim();
    const parts = trimmed.split(/[.\-/]/);

    if (parts.length >= 3) {
      const m = parseInt(parts[0], 10);
      const d = parseInt(parts[1], 10);
      const y = parseInt(parts[2], 10);

      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return { year: y, month: m, day: d };
      }
    }

    const date = new Date(trimmed);

    if (!isNaN(date.getTime())) {
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };
    }

    return null;
  }
}