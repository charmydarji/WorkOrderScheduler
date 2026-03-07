import { WorkOrderDocument } from '../models/models';
import { fromIsoDate } from './date.utils';

export function rangesOverlapInclusive(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export function hasOverlap(params: {
  workCenterId: string;
  start: Date;
  end: Date;
  orders: WorkOrderDocument[];
  excludeId?: string;
}): boolean {
  const { workCenterId, start, end, orders, excludeId } = params;

  return orders.some((o) => {
    if (o.data.workCenterId !== workCenterId) return false;
    if (excludeId && o.docId === excludeId) return false;

    const s = fromIsoDate(o.data.startDate);
    const e = fromIsoDate(o.data.endDate);

    return rangesOverlapInclusive(start, end, s, e);
  });
}