/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule, NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { WorkOrderPanelComponent } from './work-order-panel.component';
import { WorkOrderService } from '../../services/work-order.service';
import { NgbDateMonthDayYearFormatter } from '../../utils/ngb-date-formatter';
import { WorkOrderStatus } from '../../models/models';

describe('WorkOrderPanelComponent', () => {
  let component: WorkOrderPanelComponent;
  let fixture: ComponentFixture<WorkOrderPanelComponent>;
  let mockWorkOrderService: jasmine.SpyObj<WorkOrderService>;

  beforeEach(async () => {
    mockWorkOrderService = jasmine.createSpyObj('WorkOrderService', ['checkOverlap']);
    mockWorkOrderService.checkOverlap.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [
        WorkOrderPanelComponent,
        ReactiveFormsModule,
        FormsModule,
        NgSelectModule,
        NgbDatepickerModule,
      ],
      providers: [
        { provide: WorkOrderService, useValue: mockWorkOrderService },
        { provide: NgbDateParserFormatter, useClass: NgbDateMonthDayYearFormatter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkOrderPanelComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.form.get('name')?.value).toBe('');
    expect(component.form.get('status')?.value).toBe('open');
  });

  it('should mark form as invalid when name is empty', () => {
    component.form.patchValue({
      name: '',
      status: 'open',
      startDate: { year: 2026, month: 1, day: 1 },
      endDate: { year: 2026, month: 1, day: 5 },
    });

    expect(component.form.invalid).toBe(true);
  });

  it('should emit submitForm on valid submission', () => {
    spyOn(component.submitForm, 'emit');

    component.form.patchValue({
      name: 'Test Order',
      status: 'open' as WorkOrderStatus,
      startDate: { year: 2026, month: 1, day: 1 },
      endDate: { year: 2026, month: 1, day: 5 },
    });

    component.submit();

    expect(component.submitForm.emit).toHaveBeenCalled();
  });

  it('should set dateError when start date is after end date', () => {
    component.form.patchValue({
      name: 'Test Order',
      status: 'open' as WorkOrderStatus,
      startDate: { year: 2026, month: 1, day: 5 },
      endDate: { year: 2026, month: 1, day: 1 },
    });

    component.submit();

    expect(component.dateError).toBe(true);
  });

  it('should set overlapError when dates overlap', () => {
    mockWorkOrderService.checkOverlap.and.returnValue(true);

    component.form.patchValue({
      name: 'Test Order',
      status: 'open' as WorkOrderStatus,
      startDate: { year: 2026, month: 1, day: 1 },
      endDate: { year: 2026, month: 1, day: 5 },
    });

    component.submit();

    expect(component.overlapError).toBe(true);
  });
});
