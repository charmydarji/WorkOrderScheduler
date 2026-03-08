/// <reference types="jasmine" />

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { TimelineGridComponent } from './timeline-grid.component';
import { WorkOrderBarComponent } from '../work-order-bar/work-order-bar.component';
import { TimelineModel, WorkCenterDocument, WorkOrderDocument } from '../../models/models';

describe('TimelineGridComponent', () => {
  let component: TimelineGridComponent;
  let fixture: ComponentFixture<TimelineGridComponent>;

  const mockWorkCenters: WorkCenterDocument[] = [
    { docId: 'wc-1', docType: 'workCenter', data: { name: 'Workstation 1' } },
  ];

  const mockWorkOrders: WorkOrderDocument[] = [
    {
      docId: 'wo-1',
      docType: 'workOrder',
      data: {
        name: 'Order 1',
        workCenterId: 'wc-1',
        status: 'open',
        startDate: '2026-01-01',
        endDate: '2026-01-05',
      },
    },
  ];

  const mockTimeline: TimelineModel = {
    timescale: 'month',
    rangeStart: new Date('2026-01-01'),
    rangeEnd: new Date('2026-03-01'),
    columns: [
      {
        start: new Date('2026-01-01'),
        end: new Date('2026-02-01'),
        label: 'January 2026',
      },
    ],
    pxPerDay: 3.57,
    pxPerHour: undefined,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelineGridComponent, WorkOrderBarComponent, CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TimelineGridComponent);
    component = fixture.componentInstance;
    component.workCenters = mockWorkCenters;
    component.workOrders = mockWorkOrders;
    component.timeline = mockTimeline;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should accept work centers input', () => {
    expect(component.workCenters).toEqual(mockWorkCenters);
  });

  it('should return 110px column width for month timescale', () => {
    component.timeline.timescale = 'month';
    expect(component.colWidthPx).toBe(110);
  });

  it('should filter orders by work center id', () => {
    const filtered = component.ordersByCenter('wc-1');
    expect(filtered.length).toBe(1);
    expect(filtered[0].data.workCenterId).toBe('wc-1');
  });

  it('should return empty array for work center with no orders', () => {
    const filtered = component.ordersByCenter('wc-99');
    expect(filtered.length).toBe(0);
  });

  it('should emit createAt event', (done) => {
    const payload = {
      workCenterId: 'wc-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-05'),
    };

    component.createAt.subscribe((data) => {
      expect(data).toEqual(payload);
      done();
    });

    component.createAt.emit(payload);
  });
});
