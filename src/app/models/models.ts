export type WorkOrderStatus = 'open' | 'in-progress' | 'complete' | 'blocked';
export type Timescale = 'hour' | 'day' | 'week' | 'month';

export interface WorkCenterDocument {
  docId: string;
  docType: 'workCenter';
  data: { name: string };
}

export interface WorkOrderDocument {
  docId: string;
  docType: 'workOrder';
  data: {
    name: string;
    workCenterId: string;
    status: WorkOrderStatus;
    startDate: string;
    endDate: string;
  };
}

export interface TimelineColumn {
  start: Date;
  end: Date;
  label: string;
}

export interface TimelineModel {
  timescale: Timescale;
  rangeStart: Date;
  rangeEnd: Date;
  columns: TimelineColumn[];
  pxPerDay: number;
  pxPerHour?: number;
}