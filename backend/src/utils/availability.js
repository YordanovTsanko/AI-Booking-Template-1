import Booking from '../models/Booking.js';
import ApiError from './ApiError.js';
import {
  SLOT_STEP_MINUTES,
  toMinutes,
  toHHMM,
  dayOfWeek,
  combineDateTime,
} from './time.js';

/**
 * Returns true if the staff member offers the given service
 * (empty services array = offers everything).
 */
export const staffOffersService = (staff, serviceId) => {
  if (!staff.services || staff.services.length === 0) return true;
  return staff.services.some((id) => String(id) === String(serviceId));
};

/**
 * Computes free start times for a staff member on a given date.
 */
export const computeAvailableSlots = async ({ staff, duration, date, excludeBookingId = null }) => {
  if (!staff.workingDays?.includes(dayOfWeek(date))) return [];

  const workStart = toMinutes(staff.workStart || '09:00');
  const workEnd = toMinutes(staff.workEnd || '18:00');

  const filter = { staff: staff._id, date, active: true };
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };
  const bookings = await Booking.find(filter).select('time endTime').lean();
  const busy = bookings.map((b) => [toMinutes(b.time), toMinutes(b.endTime)]);

  const now = new Date();
  const slots = [];
  for (let start = workStart; start + duration <= workEnd; start += SLOT_STEP_MINUTES) {
    const end = start + duration;
    if (busy.some(([bs, be]) => start < be && end > bs)) continue;
    const time = toHHMM(start);
    if (combineDateTime(date, time) <= now) continue;
    slots.push(time);
  }
  return slots;
};

/**
 * Throws a friendly ApiError if the slot cannot be booked.
 */
export const assertSlotAvailable = async ({ staff, date, time, duration, excludeBookingId = null }) => {
  if (!staff.workingDays?.includes(dayOfWeek(date))) {
    throw ApiError.badRequest(`${staff.name} не работи в този ден. Избери друга дата.`, [
      { field: 'date', message: 'Служителят не работи в този ден' },
    ]);
  }

  const start = toMinutes(time);
  const end = start + duration;
  if (start < toMinutes(staff.workStart) || end > toMinutes(staff.workEnd)) {
    throw ApiError.badRequest(
      `Този час е извън работното време на ${staff.name} (${staff.workStart} – ${staff.workEnd}).`,
      [{ field: 'time', message: 'Часът е извън работното време' }]
    );
  }

  const filter = {
    staff: staff._id,
    date,
    active: true,
    time: { $lt: toHHMM(end) },
    endTime: { $gt: time },
  };
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };

  const overlapping = await Booking.findOne(filter).select('_id').lean();
  if (overlapping) {
    throw ApiError.conflict('Този час вече е зает, избери друг.', [
      { field: 'time', message: 'Хм, този час вече е зает. Избери друг.' },
    ]);
  }
};
