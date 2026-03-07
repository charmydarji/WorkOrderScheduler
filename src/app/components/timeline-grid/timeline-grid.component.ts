import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  PLATFORM_ID,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TimelineModel, WorkCenterDocument, WorkOrderDocument } from '../../models/models';
import { WorkOrderBarComponent } from '../work-order-bar/work-order-bar.component';
import {
  addDays,
  addHours,
  diffInDays,
  diffInHours,
  fromIsoDate,
  startOfDay,
  toIsoDate,
} from '../../utils/date.utils';

@Component({
  selector: 'app-timeline-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, WorkOrderBarComponent],
  template: `
    <div class="grid" role="grid" aria-label="Work order timeline" [attr.aria-rowcount]="workCenters.length" [attr.aria-colcount]="timeline.columns.length">
      <!-- LEFT -->
      <div class="left" role="rowgroup">
        <div class="leftHeader" role="columnheader" id="col-header-wc">Work Center</div>

        <div
          class="leftRow"
          role="row"
          *ngFor="let wc of workCenters; trackBy: trackByDocId; let i = index"
          [attr.aria-rowindex]="i + 1"
          [class.isHover]="hoverWorkCenterId === wc.docId"
          (mouseenter)="hoverWorkCenterId = wc.docId"
          (mouseleave)="hoverWorkCenterId = null"
        >
          {{ wc.data.name }}
        </div>
      </div>

      <!-- RIGHT -->
      <div class="right" #scrollEl (scroll)="onScroll()">
        <div class="rightContent" [style.min-width.px]="trackMinWidthPx">
          <div class="gridLinesOverlay" [style.min-width.px]="trackMinWidthPx">
            <div
              class="line"
              *ngFor="let c of timeline.columns; trackBy: trackByCol"
              [style.left.px]="colLeftPx(c)"
            ></div>
            <div class="line line-right"></div>
            <div
              *ngIf="todayX >= 0 && todayX < trackMinWidthPx"
              class="currentDayLine"
              [style.left.px]="todayX"
              aria-hidden="true"
            ></div>
          </div>
          <div class="rightHeader" [style.min-width.px]="trackMinWidthPx">
            <div class="headerRow monthRow">
              <div
                class="col"
                *ngFor="let c of timeline.columns; trackBy: trackByCol"
                [style.width.px]="colWidthPx"
              >
                {{ c.label }}
              </div>
            </div>
          </div>

          <div class="rows" [style.min-width.px]="trackMinWidthPx">
          <div
            class="row"
            role="row"
            *ngFor="let wc of workCenters; trackBy: trackByDocId; let i = index"
            [attr.aria-rowindex]="i + 1"
            [class.isHover]="hoverWorkCenterId === wc.docId"
            (mouseenter)="hoverWorkCenterId = wc.docId"
            (mouseleave)="hoverWorkCenterId = null"
          >
            <div
              class="track"
              [style.min-width.px]="trackMinWidthPx"
              (click)="onTrackClick($event, wc.docId)"
              role="gridcell"
              tabindex="0"
              [attr.aria-label]="'Timeline for ' + wc.data.name + '. Click to add work order.'"
              (keydown.enter)="onTrackKeydown($event, wc.docId)"
              (keydown.space)="onTrackKeydown($event, wc.docId)"
            >
              <div
                *ngIf="i === 0"
                class="currentTag"
                [style.left.px]="currentTagLeftPx"
              >
                {{ currentTagLabel }}
              </div>

              <!-- click to add (draggable) -->
              <div
                class="addCtaWrapper"
                *ngIf="activeTooltipWcId === wc.docId && (hoverWorkCenterId === wc.docId || isDraggingCta)"
                [style.left.px]="tooltipX"
                [class.dragging]="isDraggingCta"
                (mousedown)="onCtaMouseDown($event)"
                (click)="onAddCtaClick($event, wc.docId)"
                role="button"
                tabindex="0"
                aria-label="Click to add dates for new work order"
                (keydown.enter)="onAddCtaClick($event, wc.docId)"
                (keydown.space)="$event.preventDefault(); onAddCtaClick($event, wc.docId)"
              >
                <div class="addCtaButton">Click to add dates</div>
                <div class="addCtaPlaceholder"></div>
              </div>

              <ng-container *ngFor="let o of ordersByCenter(wc.docId); trackBy: trackByDocId">
                <app-work-order-bar
                  [order]="o"
                  [leftPx]="orderLeftPx(o)"
                  [widthPx]="orderWidthPx(o)"
                  [isFirstRow]="i === 0"
                  (resizeStart)="onBarResizeStart($event.edge, $event.event, o)"
                  (editOrder)="editOrder.emit($event)"
                  (deleteOrder)="deleteOrder.emit($event)"
                />
              </ng-container>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TimelineGridComponent implements AfterViewInit, OnChanges {
  private static readonly SCROLL_EDGE_THRESHOLD = 150;
  @Input({ required: true }) workCenters!: WorkCenterDocument[];
  @Input({ required: true }) workOrders!: WorkOrderDocument[];
  @Input({ required: true }) timeline!: TimelineModel;
  @Input() scrollLeftBump = 0;

  @Output() scrollNearEdge = new EventEmitter<'left' | 'right'>();
  @Output() scrollBumpApplied = new EventEmitter<void>();
  @Output() createAt = new EventEmitter<{
    workCenterId: string;
    startDate: Date;
    endDate: Date;
  }>();
  @Output() editOrder = new EventEmitter<WorkOrderDocument>();
  @Output() deleteOrder = new EventEmitter<WorkOrderDocument>();
  @Output() moveOrder = new EventEmitter<WorkOrderDocument>();

  @ViewChild('scrollEl') scrollEl!: ElementRef<HTMLDivElement>;
  #platformId = inject(PLATFORM_ID);

  hoverWorkCenterId: string | null = null;
  activeTooltipWcId: string | null = null;
  tooltipX = 0;
  isDraggingCta = false;
  private clickXInContent = 0;
  private wrapperWidth = 130;
  private resizingOrder: WorkOrderDocument | null = null;
  private resizeEdge: 'start' | 'end' | null = null;
  private resizePreviewOrder: WorkOrderDocument | null = null;
  private resizeOriginalStart: Date | null = null;
  private resizeOriginalEnd: Date | null = null;
  private scrollEdgeDebounce: ReturnType<typeof setTimeout> | null = null;

  get colWidthPx(): number {
    if (this.timeline.timescale === 'month') return 110;
    if (this.timeline.timescale === 'week') return 7 * this.pxPerDay;
    if (this.timeline.timescale === 'day') return this.pxPerDay;
    if (this.timeline.timescale === 'hour') return this.timeline.pxPerHour ?? 56;
    return 48;
  }

  /** Column left edge. Month view: header scale (110px/col). Others: track scale (pxPerDay/pxPerHour). */
  colLeftPx(col: { start: Date; end: Date }): number {
    if (this.timeline.timescale === 'month') {
      const idx = this.timeline.columns.findIndex((c) => c.start.getTime() === col.start.getTime());
      return idx >= 0 ? idx * this.colWidthPx : diffInDays(col.start, this.timeline.rangeStart) * this.pxPerDay;
    }
    if (this.timeline.timescale === 'hour') {
      return diffInHours(col.start, this.timeline.rangeStart) * this.pxPerHour;
    }
    return diffInDays(col.start, this.timeline.rangeStart) * this.pxPerDay;
  }

  get trackMinWidthPx(): number {
    if (this.timeline.timescale === 'month') {
      return this.timeline.columns.length * this.colWidthPx;
    }

    if (this.timeline.timescale === 'hour') {
      const hours = diffInHours(this.timeline.rangeEnd, this.timeline.rangeStart);
      const pxPerH = this.timeline.pxPerHour ?? 36;
      return Math.max(1200, hours * pxPerH);
    }

    const days = diffInDays(this.timeline.rangeEnd, this.timeline.rangeStart);
    return Math.max(1200, days * this.pxPerDay);
  }

  get pxPerDay(): number {
    return this.timeline.pxPerDay;
  }

  get pxPerHour(): number {
    return this.timeline.pxPerHour ?? 56;
  }

  get todayX(): number {
    const now = new Date();
    if (this.timeline.timescale === 'month') {
      return this.currentMonthColumnIndex * this.colWidthPx;
    }
    if (this.timeline.timescale === 'hour') {
      return Math.max(0, diffInHours(now, this.timeline.rangeStart) * this.pxPerHour);
    }
    return Math.max(0, diffInDays(startOfDay(now), this.timeline.rangeStart) * this.pxPerDay);
  }

  get currentMonthColumnIndex(): number {
    const now = new Date();
    const idx = this.timeline.columns.findIndex((c) => now >= c.start && now < c.end);
    return idx >= 0 ? idx : 0;
  }

  get currentTagLeftPx(): number {
    const col = this.timeline.columns[this.currentMonthColumnIndex];
    if (!col) return 0;
    const tagWidth = this.timeline.timescale === 'hour' ? 70 : 109;
    const colW = this.colWidthPxFor(col);
    const offsetRight = 12;
    return this.colLeftPx(col) + Math.max(0, (colW - tagWidth) / 2) + offsetRight;
  }

  get currentTagLabel(): string {
    return this.timeline.timescale === 'hour' ? 'Current hour' : 'Current month';
  }

  ngAfterViewInit(): void {
    this.scrollToToday();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scrollLeftBump'] && this.scrollLeftBump > 0 && this.scrollEl?.nativeElement) {
      const bump = this.scrollLeftBump;
      setTimeout(() => {
        const el = this.scrollEl?.nativeElement;
        if (el) {
          el.scrollLeft += bump;
          this.scrollBumpApplied.emit();
        }
      }, 0);
    }
  }

  onScroll(): void {
    if (this.scrollEdgeDebounce) return;
    this.scrollEdgeDebounce = setTimeout(() => {
      this.scrollEdgeDebounce = null;
      const el = this.scrollEl?.nativeElement;
      if (!el) return;
      const { scrollLeft, clientWidth, scrollWidth } = el;
      if (scrollLeft < TimelineGridComponent.SCROLL_EDGE_THRESHOLD) {
        this.scrollNearEdge.emit('left');
      } else if (scrollLeft + clientWidth > scrollWidth - TimelineGridComponent.SCROLL_EDGE_THRESHOLD) {
        this.scrollNearEdge.emit('right');
      }
    }, 100);
  }

  scrollToToday(): void {
    if (!isPlatformBrowser(this.#platformId)) return;
    const el = this.scrollEl?.nativeElement;
    if (!el || typeof el.scrollTo !== 'function') return;
    const target = this.todayX - el.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(evt: MouseEvent) {
    if (
      this.activeTooltipWcId &&
      this.scrollEl?.nativeElement &&
      !this.scrollEl.nativeElement.contains(evt.target as Node)
    ) {
      this.activeTooltipWcId = null;
    }
  }

  ordersByCenter(workCenterId: string): WorkOrderDocument[] {
    return this.workOrders.filter((o) => o.data.workCenterId === workCenterId);
  }

  orderLeftPx(o: WorkOrderDocument): number {
    const dates = this.displayDatesFor(o);
    return this.xForDate(dates.start, false);
  }

  orderWidthPx(o: WorkOrderDocument): number {
    const dates = this.displayDatesFor(o);
    const startX = this.xForDate(dates.start, false);
    const endX = this.xForDate(dates.end, true);
    return Math.max(this.minBarWidthPx(), endX - startX);
  }

  onTrackClick(evt: MouseEvent, workCenterId: string) {
    const xInContent = this.getXInContent(evt);
    this.applyTrackClick(xInContent, workCenterId);
  }

  onTrackKeydown(evt: Event, workCenterId: string) {
    const ke = evt as KeyboardEvent;
    if (ke.key !== 'Enter' && ke.key !== ' ') return;
    ke.preventDefault();
    const target = ke.target as HTMLElement;
    const scrollEl = this.scrollEl?.nativeElement;
    if (!scrollEl || !target) return;
    const trackRect = target.getBoundingClientRect();
    const scrollRect = scrollEl.getBoundingClientRect();
    const xInContent = trackRect.left - scrollRect.left + scrollEl.scrollLeft + trackRect.width / 2;
    this.applyTrackClick(xInContent, workCenterId);
  }

  private applyTrackClick(xInContent: number, workCenterId: string) {
    this.clickXInContent = Math.max(0, xInContent);
    this.tooltipX = Math.max(
      8,
      Math.min(this.trackMinWidthPx - this.wrapperWidth - 8, xInContent - this.wrapperWidth / 2)
    );
    this.activeTooltipWcId = workCenterId;
  }

  onCtaMouseDown(evt: MouseEvent) {
    evt.preventDefault();
    evt.stopPropagation();
    this.isDraggingCta = true;
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(evt: MouseEvent) {
    if (
      this.resizingOrder &&
      this.resizeEdge &&
      this.resizeOriginalStart &&
      this.resizeOriginalEnd &&
      this.scrollEl?.nativeElement
    ) {
      const xInContent = this.getXInContent(evt);
      const snappedDate = this.dateFromX(xInContent);

      const nextStart =
        this.resizeEdge === 'start'
          ? startOfDay(snappedDate <= this.resizeOriginalEnd ? snappedDate : this.resizeOriginalEnd)
          : this.resizeOriginalStart;

      const nextEnd =
        this.resizeEdge === 'end'
          ? startOfDay(snappedDate >= this.resizeOriginalStart ? snappedDate : this.resizeOriginalStart)
          : this.resizeOriginalEnd;

      this.resizePreviewOrder = {
        ...this.resizingOrder,
        data: {
          ...this.resizingOrder.data,
          startDate: toIsoDate(nextStart),
          endDate: toIsoDate(nextEnd),
        },
      };
      return;
    }

    if (!this.isDraggingCta || !this.activeTooltipWcId || !this.scrollEl?.nativeElement) return;
    const xInContent = this.getXInContent(evt);
    this.clickXInContent = Math.max(0, Math.min(this.trackMinWidthPx - 8, xInContent));
    this.tooltipX = Math.max(
      8,
      Math.min(this.trackMinWidthPx - this.wrapperWidth - 8, xInContent - this.wrapperWidth / 2)
    );
  }

  @HostListener('document:mouseup', ['$event'])
  onDocumentMouseUp() {
    if (this.resizingOrder) {
      if (
        this.resizePreviewOrder &&
        (this.resizePreviewOrder.data.startDate !== this.resizingOrder.data.startDate ||
          this.resizePreviewOrder.data.endDate !== this.resizingOrder.data.endDate)
      ) {
        this.moveOrder.emit(this.resizePreviewOrder);
      }

      this.resizingOrder = null;
      this.resizeEdge = null;
      this.resizeOriginalStart = null;
      this.resizeOriginalEnd = null;
      this.resizePreviewOrder = null;
      return;
    }

    this.isDraggingCta = false;
  }

  onBarResizeStart(edge: 'start' | 'end', evt: MouseEvent, order: WorkOrderDocument): void {
    evt.preventDefault();
    evt.stopPropagation();

    this.resizingOrder = order;
    this.resizeEdge = edge;
    this.resizeOriginalStart = fromIsoDate(order.data.startDate);
    this.resizeOriginalEnd = fromIsoDate(order.data.endDate);
    this.resizePreviewOrder = order;
  }

  onAddCtaClick(evt: Event, workCenterId: string): void {
    evt.stopPropagation();

    const range = this.getRangeFromX(this.clickXInContent);
    if (!range) return;

    this.activeTooltipWcId = null;

    this.createAt.emit({
      workCenterId,
      startDate: range.startDate,
      endDate: range.endDate,
    });
  }

  private colWidthPxFor(col: { start: Date; end: Date }): number {
    if (this.timeline.timescale === 'month') return this.colWidthPx;
    if (this.timeline.timescale === 'hour') {
      return diffInHours(col.end, col.start) * this.pxPerHour;
    }
    return diffInDays(col.end, col.start) * this.pxPerDay;
  }

  private displayDatesFor(o: WorkOrderDocument): { start: Date; end: Date } {
    if (this.resizePreviewOrder?.docId === o.docId) {
      return {
        start: fromIsoDate(this.resizePreviewOrder.data.startDate),
        end: fromIsoDate(this.resizePreviewOrder.data.endDate),
      };
    }

    return {
      start: fromIsoDate(o.data.startDate),
      end: fromIsoDate(o.data.endDate),
    };
  }

  private minBarWidthPx(): number {
    if (this.timeline.timescale === 'month') return 28;
    if (this.timeline.timescale === 'hour') return Math.max(18, this.pxPerHour * 0.5);
    return Math.max(18, this.pxPerDay * 0.5);
  }

  /** @param endOfDay When true, returns right edge of the day (for inclusive end dates). */
  private xForDate(date: Date, endOfDay: boolean): number {
    const day = startOfDay(date);

    if (this.timeline.timescale === 'month') {
      const idx = this.timeline.columns.findIndex((c) => day >= c.start && day < c.end);
      if (idx < 0) return 0;

      const col = this.timeline.columns[idx];
      const daysInColumn = Math.max(1, diffInDays(col.end, col.start));
      const dayOffset = diffInDays(day, col.start) + (endOfDay ? 1 : 0.5);
      return idx * this.colWidthPx + (dayOffset / daysInColumn) * this.colWidthPx;
    }

    if (this.timeline.timescale === 'hour') {
      const dayStart = diffInHours(day, this.timeline.rangeStart) * this.pxPerHour;
      if (endOfDay) {
        const nextDay = addDays(day, 1);
        return Math.max(0, diffInHours(nextDay, this.timeline.rangeStart) * this.pxPerHour);
      }
      return Math.max(0, dayStart);
    }

    const daysFromStart = diffInDays(day, this.timeline.rangeStart) + (endOfDay ? 1 : 0);
    return Math.max(0, daysFromStart * this.pxPerDay);
  }

  private dateFromX(xInContent: number): Date {
    const x = Math.max(0, xInContent);

    if (this.timeline.timescale === 'month') {
      const colIdx = Math.min(this.timeline.columns.length - 1, Math.max(0, Math.floor(x / this.colWidthPx)));
      const col = this.timeline.columns[colIdx];
      const localX = x - colIdx * this.colWidthPx;
      const daysInColumn = Math.max(1, diffInDays(col.end, col.start));
      const dayIdx = Math.min(
        daysInColumn - 1,
        Math.max(0, Math.round((localX / this.colWidthPx) * daysInColumn - 0.5))
      );
      return startOfDay(addDays(col.start, dayIdx));
    }

    if (this.timeline.timescale === 'hour') {
      const pxPerDayInHourView = this.pxPerHour * 24;
      const daysFromStart = Math.max(0, Math.round(x / pxPerDayInHourView - 0.5));
      return startOfDay(addDays(this.timeline.rangeStart, daysFromStart));
    }

    const daysFromStart = Math.max(0, Math.round(x / this.pxPerDay - 0.5));
    return startOfDay(addDays(this.timeline.rangeStart, daysFromStart));
  }

  private getRangeFromX(xInContent: number): { startDate: Date; endDate: Date } | null {
    if (xInContent < 0) return null;

    if (this.timeline.timescale === 'month') {
      const colIdx = Math.floor(xInContent / this.colWidthPx);
      const col = this.timeline.columns[colIdx];
      if (col) {
        const startDate = new Date(col.start);
        const endDate = new Date(col.end);
        endDate.setDate(endDate.getDate() - 1);
        return { startDate, endDate };
      }
      const lastCol = this.timeline.columns[this.timeline.columns.length - 1];
      if (!lastCol) return null;
      const startDate = new Date(lastCol.start);
      const endDate = new Date(lastCol.end);
      endDate.setDate(endDate.getDate() - 1);
      return { startDate, endDate };
    }

    if (this.timeline.timescale === 'week') {
      const daysFromStart = Math.max(0, Math.floor(xInContent / this.pxPerDay));
      const startDate = startOfDay(addDays(this.timeline.rangeStart, daysFromStart));
      const endDate = addDays(startDate, 6);
      return { startDate, endDate };
    }

    if (this.timeline.timescale === 'day') {
      const daysFromStart = Math.max(0, Math.floor(xInContent / this.pxPerDay));
      const startDate = startOfDay(addDays(this.timeline.rangeStart, daysFromStart));
      const endDate = new Date(startDate);
      return { startDate, endDate };
    }

    if (this.timeline.timescale === 'hour') {
      const pxPerDayInHourView = this.pxPerHour * 24;
      const daysFromStart = Math.max(0, Math.floor(xInContent / pxPerDayInHourView));
      const startDate = startOfDay(addDays(this.timeline.rangeStart, daysFromStart));
      const endDate = new Date(startDate);
      return { startDate, endDate };
    }

    return null;
  }

  trackByDocId(_: number, x: { docId: string }) {
    return x.docId;
  }

  /** @upgrade Use column.start.getTime() if label collisions occur with infinite scroll. */
  trackByCol(_: number, x: { label: string; start?: Date }) {
    return x.start ? x.start.getTime() : x.label;
  }

  private getXInContent(evt: MouseEvent): number {
    const el = this.scrollEl.nativeElement;
    return evt.clientX - el.getBoundingClientRect().left + el.scrollLeft;
  }
}