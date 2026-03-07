import { Component, ChangeDetectionStrategy, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrderDocument, WorkOrderStatus } from '../../models/models';
import { BarTooltipService } from '../../services/bar-tooltip.service';

export type ResizeEdge = 'start' | 'end';

/** @upgrade Add keyboard shortcut (e.g. Delete) to delete bar when focused. */
@Component({
  selector: 'app-work-order-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="bar"
      [style.left.px]="leftPx"
      [style.min-width.px]="widthPx"
      [ngClass]="statusClass(order.data.status)"
      (mouseenter)="onMouseEnter($event)"
      (mouseleave)="onMouseLeave()"
    >
      <button
        class="resizeHandle resizeHandleStart"
        type="button"
        aria-label="Resize start date"
        (mousedown)="onResizeMouseDown($event, 'start')"
        (click)="$event.stopPropagation()"
      ></button>

      <div class="name">{{ order.data.name }}</div>

      <div class="right">
        <span class="status" [ngClass]="statusPillClass(order.data.status)">
          {{ statusLabel(order.data.status) }}
        </span>

        <button
          *ngIf="isHovered || menuOpen"
          class="options-btn"
          type="button"
          aria-label="More options"
          (click)="onMenuToggle($event)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="8" r="1.5" fill="currentColor"/>
          </svg>
        </button>
      </div>

      <button
        class="resizeHandle resizeHandleEnd"
        type="button"
        aria-label="Resize end date"
        (mousedown)="onResizeMouseDown($event, 'end')"
        (click)="$event.stopPropagation()"
      ></button>
    </div>

    <!-- Menu rendered outside the bar to escape overflow:hidden ancestors -->
    <div
      *ngIf="menuOpen"
      class="options-menu"
      role="menu"
      [style.top.px]="menuTop"
      [style.left.px]="menuLeft"
      (click)="$event.stopPropagation()"
    >
      <button class="menu-item" type="button" role="menuitem" (click)="onEdit($event)">Edit</button>
      <button class="menu-item menu-item-delete" type="button" role="menuitem" (click)="onDelete($event)">Delete</button>
    </div>
  `,
})
export class WorkOrderBarComponent {
  @Input({ required: true }) order!: WorkOrderDocument;
  @Input({ required: true }) leftPx!: number;
  @Input({ required: true }) widthPx!: number;
  @Input() isFirstRow = false;

  @Output() editOrder = new EventEmitter<WorkOrderDocument>();
  @Output() deleteOrder = new EventEmitter<WorkOrderDocument>();
  @Output() resizeStart = new EventEmitter<{ edge: ResizeEdge; event: MouseEvent }>();

  isHovered = false;
  menuOpen = false;
  menuTop = 0;
  menuLeft = 0;

  constructor(
    private elRef: ElementRef,
    private tooltipService: BarTooltipService,
  ) {}

  onMouseEnter(evt: MouseEvent): void {
    this.isHovered = true;
    if (this.menuOpen) return;
    const bar = evt.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const left = rect.left + rect.width / 2;
    const top = this.isFirstRow ? rect.bottom + 4 : rect.top - 4;
    this.tooltipService.show({
      name: this.order.data.name,
      status: this.order.data.status,
      statusLabel: this.statusLabel(this.order.data.status),
      startDate: this.order.data.startDate,
      endDate: this.order.data.endDate,
      top,
      left,
      isFirstRow: this.isFirstRow,
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(evt: MouseEvent): void {
    if (this.menuOpen && !this.elRef.nativeElement.contains(evt.target as Node)) {
      this.menuOpen = false;
    }
  }

  onMouseLeave(): void {
    this.isHovered = false;
    this.tooltipService.hide();
  }

  onMenuToggle(evt: MouseEvent): void {
    evt.stopPropagation();
    this.tooltipService.hide();
    if (!this.menuOpen) {
      const btn = evt.currentTarget as HTMLElement;
      const rect = btn.getBoundingClientRect();
      this.menuTop = rect.bottom + 6;
      this.menuLeft = rect.right - 130;
    }
    this.menuOpen = !this.menuOpen;
  }

  onEdit(evt: MouseEvent): void {
    evt.stopPropagation();
    this.menuOpen = false;
    this.editOrder.emit(this.order);
  }

  onDelete(evt: MouseEvent): void {
    evt.stopPropagation();
    this.menuOpen = false;
    this.deleteOrder.emit(this.order);
  }

  private static readonly STATUS_LABELS: Record<WorkOrderStatus, string> = {
    'open': 'Open',
    'in-progress': 'In progress',
    'complete': 'Complete',
    'blocked': 'Blocked',
  };

  private static readonly STATUS_PILL_CLASSES: Record<WorkOrderStatus, string> = {
    'open': 'pill-open',
    'in-progress': 'pill-in-progress',
    'complete': 'pill-complete',
    'blocked': 'pill-blocked',
  };

  private static readonly STATUS_CLASSES: Record<WorkOrderStatus, string> = {
    'open': 's-open',
    'in-progress': 's-in-progress',
    'complete': 's-complete',
    'blocked': 's-blocked',
  };

  statusLabel(s: WorkOrderStatus): string {
    return WorkOrderBarComponent.STATUS_LABELS[s];
  }

  statusPillClass(s: WorkOrderStatus): string {
    return WorkOrderBarComponent.STATUS_PILL_CLASSES[s];
  }

  statusClass(s: WorkOrderStatus): string {
    return WorkOrderBarComponent.STATUS_CLASSES[s];
  }

  onResizeMouseDown(evt: MouseEvent, edge: ResizeEdge): void {
    evt.preventDefault();
    evt.stopPropagation();
    this.resizeStart.emit({ edge, event: evt });
  }
}