import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WORK_CENTERS, WORK_ORDERS } from '../data/sample-data';
import { WorkCenterDocument, WorkOrderDocument } from '../models/models';
import { hasOverlap } from '../utils/overlap.utils';
import { fromIsoDate } from '../utils/date.utils';

const STORAGE_KEY = 'wos_work_orders_v2';

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private workCentersSubject = new BehaviorSubject<WorkCenterDocument[]>(WORK_CENTERS);
  private workOrdersSubject = new BehaviorSubject<WorkOrderDocument[]>(this.loadOrDefault());

  workCenters$ = this.workCentersSubject.asObservable();
  workOrders$ = this.workOrdersSubject.asObservable();

  getWorkCentersSnapshot(): WorkCenterDocument[] {
    return this.workCentersSubject.value;
  }

  getWorkOrdersSnapshot(): WorkOrderDocument[] {
    return this.workOrdersSubject.value;
  }

  create(order: WorkOrderDocument): void {
    this.push([...this.workOrdersSubject.value, order]);
  }

  update(order: WorkOrderDocument): void {
    this.push(this.workOrdersSubject.value.map((x) => (x.docId === order.docId ? order : x)));
  }

  delete(id: string): void {
    this.push(this.workOrdersSubject.value.filter((x) => x.docId !== id));
  }

  checkOverlap(params: {
    workCenterId: string;
    startIso: string;
    endIso: string;
    excludeId?: string;
  }): boolean {
    const start = fromIsoDate(params.startIso);
    const end = fromIsoDate(params.endIso);

    return hasOverlap({
      workCenterId: params.workCenterId,
      start,
      end,
      orders: this.workOrdersSubject.value,
      excludeId: params.excludeId,
    });
  }

  private push(orders: WorkOrderDocument[]): void {
    this.workOrdersSubject.next(orders);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {}
  }

  private loadOrDefault(): WorkOrderDocument[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as WorkOrderDocument[];
    } catch {}
    return WORK_ORDERS;
  }
}