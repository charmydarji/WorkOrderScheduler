import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WorkOrderStatus } from '../models/models';

export interface BarTooltipData {
  name: string;
  status: WorkOrderStatus;
  statusLabel: string;
  startDate: string;
  endDate: string;
  top: number;
  left: number;
  isFirstRow: boolean;
}

@Injectable({ providedIn: 'root' })
export class BarTooltipService {
  private readonly _data$ = new BehaviorSubject<BarTooltipData | null>(null);
  readonly tooltip$ = this._data$.asObservable();

  show(data: BarTooltipData): void {
    this._data$.next(data);
  }

  hide(): void {
    this._data$.next(null);
  }
}
