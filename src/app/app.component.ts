import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelinePageComponent } from './components/timeline-page/timeline-page.component';
import { BarTooltipService } from './services/bar-tooltip.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TimelinePageComponent],
  template: `
    <app-timeline-page />
    <!-- Tooltip overlay at root level so it appears above all timeline content -->
    <div
      *ngIf="tooltip$ | async as tooltip"
      class="bar-tooltip bar-tooltip-overlay"
      [class.bar-tooltip-below]="tooltip.isFirstRow"
      [style.top.px]="tooltip.top"
      [style.left.px]="tooltip.left"
    >
      <div class="bar-tooltip-name">{{ tooltip.name }}</div>
      <span class="status-pill bar-tooltip-pill" [ngClass]="'pill-' + tooltip.status">
        {{ tooltip.statusLabel }}
      </span>
      <div class="bar-tooltip-dates">{{ tooltip.startDate }} → {{ tooltip.endDate }}</div>
    </div>
  `,
})
export class AppComponent {
  readonly tooltip$: BarTooltipService['tooltip$'];

  constructor(private tooltipService: BarTooltipService) {
    this.tooltip$ = this.tooltipService.tooltip$;
  }
}