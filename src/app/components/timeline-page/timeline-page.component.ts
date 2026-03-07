import { Component, ChangeDetectionStrategy, computed, signal, inject, ViewChild, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { WorkOrderService } from '../../services/work-order.service';
import { Timescale, WorkOrderDocument } from '../../models/models';
import { TimelineHeaderComponent } from '../timeline-header/timeline-header.component';
import { TimelineGridComponent } from '../timeline-grid/timeline-grid.component';
import {
  WorkOrderPanelComponent,
  PanelMode,
  PanelSubmitPayload,
} from '../work-order-panel/work-order-panel.component';
import {
  buildTimelineFromRange,
  extendRangeLeft,
  extendRangeRight,
  getInitialRange,
  TimelineRange,
} from '../../utils/timeline.utils';
import { addDays, toIsoDate } from '../../utils/date.utils';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-timeline-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TimelineHeaderComponent, TimelineGridComponent, WorkOrderPanelComponent],
  template: `
    <div class="page">
      <header class="main-header">
        <div class="brand">
          <img src="assets/naologic-logo.png" alt="Naologic" class="brand-logo" />
        </div>

        <div class="header-content">
          <h1 class="title">Work Orders</h1>

          <div class="header-actions">
            <button class="btn today-btn" type="button" aria-label="Scroll to today" (click)="goToToday()">Today</button>
            <app-timeline-header
              [timescale]="timescale()"
              (timescaleChange)="timescale.set($event)"
            />
          </div>
        </div>
      </header>

      <div class="grid-container">
        <app-timeline-grid
          #timelineGrid
          [workCenters]="workCenters()"
          [workOrders]="workOrders()"
          [timeline]="timeline()"
          [scrollLeftBump]="scrollLeftBump()"
          (createAt)="openCreate($event.workCenterId, $event.startDate, $event.endDate)"
          (editOrder)="openEdit($event)"
          (deleteOrder)="deleteOrder($event)"
          (moveOrder)="moveOrder($event)"
          (scrollNearEdge)="onScrollNearEdge($event)"
          (scrollBumpApplied)="scrollLeftBump.set(0)"
        />
      </div>

      <div class="backdrop" *ngIf="panelOpen()" (click)="closePanel()"></div>

      <app-work-order-panel
        *ngIf="panelOpen()"
        [open]="true"
        [mode]="panelMode()"
        [workCenterId]="panelWorkCenterId()"
        [order]="panelOrder()"
        [initialStartDateIso]="panelInitialStartIso()"
        [initialEndDateIso]="panelInitialEndIso()"
        (close)="closePanel()"
        (submitForm)="onPanelSubmit($event)"
      />
    </div>
  `,
})
export class TimelinePageComponent {
  @ViewChild('timelineGrid') timelineGrid!: TimelineGridComponent;

  private svc = inject(WorkOrderService);

  timescale = signal<Timescale>('month');
  range = signal<TimelineRange>(getInitialRange('month', new Date()));
  scrollLeftBump = signal<number>(0);

  workCenters = toSignal(this.svc.workCenters$, { requireSync: true });
  workOrders = toSignal(this.svc.workOrders$, { requireSync: true });

  timeline = computed(() => buildTimelineFromRange(this.timescale(), this.range()));

  /** @upgrade Consider preserving scroll position when timescale changes. */
  constructor() {
    effect(() => {
      this.timescale();
      this.range.set(getInitialRange(this.timescale(), new Date()));
    });
  }

  panelOpen = signal(false);
  panelMode = signal<PanelMode>('create');
  panelWorkCenterId = signal<string>('');
  panelOrder = signal<WorkOrderDocument | null>(null);
  panelInitialStartIso = signal<string>('');
  panelInitialEndIso = signal<string>('');

  openCreate(workCenterId: string, startDate: Date, _endDate: Date) {
    this.panelMode.set('create');
    this.panelWorkCenterId.set(workCenterId);
    this.panelOrder.set(null);

    this.panelInitialStartIso.set(toIsoDate(startDate));
    this.panelInitialEndIso.set(toIsoDate(addDays(startDate, 7)));
    this.panelOpen.set(true);
  }

  openEdit(order: WorkOrderDocument) {
    this.panelMode.set('edit');
    this.panelWorkCenterId.set(order.data.workCenterId);
    this.panelOrder.set(order);
    this.panelInitialStartIso.set(order.data.startDate);
    this.panelInitialEndIso.set(order.data.endDate);
    this.panelOpen.set(true);
  }

  deleteOrder(order: WorkOrderDocument) {
    this.svc.delete(order.docId);
  }

  moveOrder(order: WorkOrderDocument) {
    const overlap = this.svc.checkOverlap({
      workCenterId: order.data.workCenterId,
      startIso: order.data.startDate,
      endIso: order.data.endDate,
      excludeId: order.docId,
    });

    if (overlap) return;

    this.svc.update(order);
  }

  goToToday(): void {
    this.timelineGrid?.scrollToToday();
  }

  onScrollNearEdge(direction: 'left' | 'right'): void {
    const ts = this.timescale();
    const r = this.range();
    if (direction === 'left') {
      const extendAmount = ts === 'month' ? 4 : ts === 'week' ? 4 : ts === 'day' ? 14 : 24;
      const { newRangeStart, addedWidthPx } = extendRangeLeft(r, ts, extendAmount);
      this.range.set({ ...r, rangeStart: newRangeStart });
      this.scrollLeftBump.set(addedWidthPx);
    } else {
      const extendAmount = ts === 'month' ? 4 : ts === 'week' ? 4 : ts === 'day' ? 14 : 24;
      const newRangeEnd = extendRangeRight(r, ts, extendAmount);
      this.range.set({ ...r, rangeEnd: newRangeEnd });
    }
  }

  closePanel() {
    this.panelOpen.set(false);
  }

  onPanelSubmit(payload: PanelSubmitPayload) {
    if (payload.mode === 'create') {
      const doc: WorkOrderDocument = {
        docId: uuidv4(),
        docType: 'workOrder',
        data: {
          name: payload.name.trim(),
          workCenterId: payload.workCenterId,
          status: payload.status,
          startDate: payload.startIso,
          endDate: payload.endIso,
        },
      };

      this.svc.create(doc);
    } else {
      const existing = payload.existingOrder!;
      const updated: WorkOrderDocument = {
        ...existing,
        data: {
          ...existing.data,
          name: payload.name.trim(),
          status: payload.status,
          startDate: payload.startIso,
          endDate: payload.endIso,
        },
      };

      this.svc.update(updated);
    }

    this.panelOpen.set(false);
  }
}