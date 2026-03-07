import { Component, ChangeDetectionStrategy, EventEmitter, HostListener, inject, Input, Output, OnChanges, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerConfig, NgbDatepickerModule, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { WorkOrderDocument, WorkOrderStatus } from '../../models/models';
import { NgbDateMonthDayYearFormatter } from '../../utils/ngb-date-formatter';
import { fromIsoDate, isoToNgbDate, ngbDateToIso } from '../../utils/date.utils';
import { WorkOrderService } from '../../services/work-order.service';

export type PanelMode = 'create' | 'edit';

export interface PanelSubmitPayload {
  mode: PanelMode;
  workCenterId: string;
  name: string;
  status: WorkOrderStatus;
  startIso: string;
  endIso: string;
  existingOrder?: WorkOrderDocument | null;
}

@Component({
  selector: 'app-work-order-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgSelectModule, NgbDatepickerModule],
  providers: [
    { provide: NgbDateParserFormatter, useClass: NgbDateMonthDayYearFormatter },
  ],
  template: `
    <div class="overlay" *ngIf="open" aria-label="Close panel" (click)="close.emit()"></div>

    <aside class="panel" [class.open]="open" role="dialog" aria-modal="true" aria-labelledby="panel-title" (click)="$event.stopPropagation()" #panelEl tabindex="-1">
      <div class="panelHeader">
        <div>
          <div class="h1" id="panel-title">Work Order Details</div>
          <div class="sub">Specify the dates, name and status for this order</div>
        </div>

        <div class="actions">
          <button class="btn ghost" type="button" aria-label="Cancel and close" (click)="close.emit()">Cancel</button>
          <button class="btn primary" type="button" [attr.aria-label]="mode === 'create' ? 'Create work order' : 'Save work order'" (click)="submit()">
            {{ mode === 'create' ? 'Create' : 'Save' }}
          </button>
        </div>
      </div>

      <form class="form" [formGroup]="form" (submit)="$event.preventDefault()" (keydown)="onFormKeydown($event)">
        <label for="wo-name">Work Order Name</label>
        <input id="wo-name" class="input" formControlName="name" placeholder="Acme Inc." aria-required="true" aria-label="Work order name" [attr.aria-invalid]="form.controls.name.invalid && triedSubmit" #firstInput />

        <label>Status</label>
        <ng-select
          class="select status-select"
          aria-label="Work order status"
          [items]="statusOptions"
          bindLabel="label"
          bindValue="value"
          [clearable]="false"
          [searchable]="false"
          formControlName="status"
        >
          <ng-template ng-label-tmp let-item="item">
            <span class="status-pill" [ngClass]="'pill-' + item.value">{{ item.label }}</span>
          </ng-template>
          <ng-template ng-option-tmp let-item="item">
            <span class="status-option-label">{{ item.label }}</span>
          </ng-template>
        </ng-select>

        <label for="wo-start">Start date</label>
        <input
          id="wo-start"
          class="form-control input"
          placeholder="01.01.2026"
          formControlName="startDate"
          ngbDatepicker
          navigation="select"
          #startDp="ngbDatepicker"
          (click)="startDp.toggle()"
          aria-required="true"
          aria-label="Start date"
          [attr.aria-describedby]="(dateError || overlapError || (form.invalid && triedSubmit)) ? 'wo-errors' : null"
          [attr.aria-invalid]="form.controls.startDate.invalid && triedSubmit"
          readonly
        />

        <label for="wo-end">End date</label>
        <input
          id="wo-end"
          class="form-control input"
          placeholder="01.01.2026"
          formControlName="endDate"
          ngbDatepicker
          navigation="select"
          #endDp="ngbDatepicker"
          (click)="endDp.toggle()"
          aria-required="true"
          aria-label="End date"
          [attr.aria-describedby]="(dateError || overlapError || (form.invalid && triedSubmit)) ? 'wo-errors' : null"
          [attr.aria-invalid]="form.controls.endDate.invalid && triedSubmit"
          readonly
        />

        <div id="wo-errors" role="alert" aria-live="polite">
          <div class="error" *ngIf="overlapError">
            Work order overlaps with another order on this work center. Please change dates.
          </div>
          <div class="error" *ngIf="dateError">
            Start date must be before or equal to End date.
          </div>
          <div class="error" *ngIf="form.invalid && triedSubmit">
            Please fill all required fields.
          </div>
        </div>
      </form>
    </aside>
  `,
})
export class WorkOrderPanelComponent implements OnChanges, AfterViewChecked {
  @Input({ required: true }) open!: boolean;
  @Input({ required: true }) mode!: PanelMode;
  @Input({ required: true }) workCenterId!: string;

  @Input() order: WorkOrderDocument | null = null;
  @Input() initialStartDateIso = '';
  @Input() initialEndDateIso = '';

  @Output() close = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<PanelSubmitPayload>();

  @ViewChild('panelEl') panelEl!: ElementRef<HTMLElement>;
  @ViewChild('firstInput') firstInput!: ElementRef<HTMLInputElement>;

  triedSubmit = false;
  private shouldFocus = false;
  overlapError = false;
  dateError = false;

  statusOptions = [
    { label: 'Open', value: 'open' as WorkOrderStatus },
    { label: 'In progress', value: 'in-progress' as WorkOrderStatus },
    { label: 'Complete', value: 'complete' as WorkOrderStatus },
    { label: 'Blocked', value: 'blocked' as WorkOrderStatus },
  ];

  form = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    status: new FormControl<WorkOrderStatus>('open', { nonNullable: true, validators: [Validators.required] }),
    startDate: new FormControl<NgbDateStruct | null>(null, { validators: [Validators.required] }),
    endDate: new FormControl<NgbDateStruct | null>(null, { validators: [Validators.required] }),
  });

  private svc = inject(WorkOrderService);

  constructor(private ngbDatepickerConfig: NgbDatepickerConfig) {
    this.ngbDatepickerConfig.navigation = 'select';
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open) this.close.emit();
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: KeyboardEvent): void {
    if (!this.open) return;
    const el = event.target as HTMLElement;
    if (el.closest('.ng-dropdown-panel') || el.closest('.ngb-datepicker')) return;
    event.preventDefault();
    this.submit();
  }

  ngAfterViewChecked(): void {
    if (this.shouldFocus && this.open) {
      this.shouldFocus = false;
      setTimeout(() => {
        if (this.firstInput?.nativeElement) {
          this.firstInput.nativeElement.focus();
        } else if (this.panelEl?.nativeElement) {
          this.panelEl.nativeElement.focus();
        }
      }, 0);
    }
  }

  onFormKeydown(evt: KeyboardEvent): void {
    if (evt.key !== 'Tab') return;
    const focusables = this.getFocusableElements();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (evt.shiftKey) {
      if (document.activeElement === first) {
        evt.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        evt.preventDefault();
        first.focus();
      }
    }
  }

  /** @upgrade Consider @angular/cdk/a11y FocusTrap for robust focus containment. */
  private getFocusableElements(): HTMLElement[] {
    const el = this.panelEl?.nativeElement;
    if (!el) return [];
    const selector = 'input:not([type="hidden"]), button, select, [role="combobox"]';
    return Array.from(el.querySelectorAll<HTMLElement>(selector)).filter(
      (e) => !e.hasAttribute('disabled') && (e.getAttribute('tabindex') ?? '0') !== '-1'
    );
  }

  ngOnChanges(): void {
    if (!this.open) return;

    this.shouldFocus = true;
    this.triedSubmit = false;
    this.overlapError = false;
    this.dateError = false;

    if (this.mode === 'edit' && this.order) {
      this.form.patchValue({
        name: this.order.data.name,
        status: this.order.data.status,
        startDate: isoToNgbDate(this.order.data.startDate),
        endDate: isoToNgbDate(this.order.data.endDate),
      });
    } else {
      this.form.patchValue({
        name: '',
        status: 'open',
        startDate: isoToNgbDate(this.initialStartDateIso),
        endDate: isoToNgbDate(this.initialEndDateIso),
      });
    }
  }

  submit() {
    this.triedSubmit = true;
    this.overlapError = false;
    this.dateError = false;

    const startNgb = this.form.controls.startDate.value;
    const endNgb = this.form.controls.endDate.value;
    const startIso = ngbDateToIso(startNgb);
    const endIso = ngbDateToIso(endNgb);

    if (this.form.controls.name.invalid || this.form.controls.status.invalid || !startNgb || !endNgb) return;

    const start = fromIsoDate(startIso);
    const end = fromIsoDate(endIso);

    if (start > end) {
      this.dateError = true;
      return;
    }

    const excludeId = this.mode === 'edit' && this.order ? this.order.docId : undefined;
    const overlap = this.svc.checkOverlap({
      workCenterId: this.workCenterId,
      startIso,
      endIso,
      excludeId,
    });

    if (overlap) {
      this.overlapError = true;
      return;
    }

    this.submitForm.emit({
      mode: this.mode,
      workCenterId: this.workCenterId,
      name: this.form.controls.name.value,
      status: this.form.controls.status.value,
      startIso,
      endIso,
      existingOrder: this.order,
    });
  }

}
