import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Timescale } from '../../models/models';

@Component({
  selector: 'app-timeline-header',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  template: `
    <div class="timescale-header">
      <span class="timescale-label">Timescale</span>
      <div class="timescale-dropdown-wrap">
        <ng-select
          class="timescale-select"
          panelClass="timescale-dropdown-panel"
          [clearable]="false"
          [searchable]="false"
          [items]="options"
          bindLabel="label"
          bindValue="value"
          [ngModel]="timescale"
          (ngModelChange)="onTimescaleChange($event)"
        >
          <ng-template ng-label-tmp let-item="item">
            <span class="selected-option">{{ item.label }}</span>
          </ng-template>
          <ng-template ng-option-tmp let-item="item">
            <span [ngClass]="{'selected-option': item.value === timescale}">{{ item.label }}</span>
          </ng-template>
        </ng-select>
      </div>
    </div>
  `,
})
export class TimelineHeaderComponent {
  @Input({ required: true }) timescale!: Timescale;
  @Output() timescaleChange = new EventEmitter<Timescale>();

  options = [
    { label: 'Hour', value: 'hour' as Timescale },
    { label: 'Day', value: 'day' as Timescale },
    { label: 'Week', value: 'week' as Timescale },
    { label: 'Month', value: 'month' as Timescale },
  ];

  onTimescaleChange(value: Timescale) {
    this.timescaleChange.emit(value);
  }
}