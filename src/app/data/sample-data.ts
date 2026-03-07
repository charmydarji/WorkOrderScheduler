import { WorkCenterDocument, WorkOrderDocument } from '../models/models';

export const WORK_CENTERS: WorkCenterDocument[] = [
  { docId: 'wc-1', docType: 'workCenter', data: { name: 'Genesis Hardware' } },
  { docId: 'wc-2', docType: 'workCenter', data: { name: 'Rodriques Electrics' } },
  { docId: 'wc-3', docType: 'workCenter', data: { name: 'Konsulting Inc' } },
  { docId: 'wc-4', docType: 'workCenter', data: { name: 'McMarrow Distribution' } },
  { docId: 'wc-5', docType: 'workCenter', data: { name: 'Spartan Manufacturing' } },
];

export const WORK_ORDERS: WorkOrderDocument[] = [
  // Genesis Hardware — 2 orders (no overlap)
  { docId: 'wo-1', docType: 'workOrder', data: { name: 'Gear Assembly Run',    workCenterId: 'wc-1', status: 'complete',    startDate: '2026-01-06', endDate: '2026-01-24' } },
  { docId: 'wo-2', docType: 'workOrder', data: { name: 'Prototype Batch #4',   workCenterId: 'wc-1', status: 'in-progress', startDate: '2026-03-15', endDate: '2026-03-30' } },
  // Rodriques Electrics — 2 orders (no overlap)
  { docId: 'wo-3', docType: 'workOrder', data: { name: 'Circuit Board Fab',    workCenterId: 'wc-2', status: 'open',        startDate: '2026-02-03', endDate: '2026-02-20' } },
  { docId: 'wo-4', docType: 'workOrder', data: { name: 'Wiring Harness Order', workCenterId: 'wc-2', status: 'open',        startDate: '2026-04-06', endDate: '2026-04-24' } },
  // Konsulting Inc — 1 order
  { docId: 'wo-5', docType: 'workOrder', data: { name: 'Q1 System Audit',      workCenterId: 'wc-3', status: 'complete',    startDate: '2026-01-13', endDate: '2026-01-31' } },
  // McMarrow Distribution — 2 orders (no overlap)
  { docId: 'wo-6', docType: 'workOrder', data: { name: 'Pallet Sorting Run',   workCenterId: 'wc-4', status: 'blocked',     startDate: '2026-02-10', endDate: '2026-02-28' } },
  { docId: 'wo-7', docType: 'workOrder', data: { name: 'Freight Dispatch',     workCenterId: 'wc-4', status: 'in-progress', startDate: '2026-05-04', endDate: '2026-05-22' } },
  // Spartan Manufacturing — 2 orders (no overlap)
  { docId: 'wo-8', docType: 'workOrder', data: { name: 'CNC Run Batch A',      workCenterId: 'wc-5', status: 'complete',    startDate: '2026-03-09', endDate: '2026-03-27' } },
  { docId: 'wo-9', docType: 'workOrder', data: { name: 'CNC Run Batch B',      workCenterId: 'wc-5', status: 'open',        startDate: '2026-06-01', endDate: '2026-06-19' } },
];