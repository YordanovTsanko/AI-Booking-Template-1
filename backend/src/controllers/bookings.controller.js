import mongoose from 'mongoose';
import Booking, { ACTIVE_STATUSES } from '../models/Booking.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPaginationMeta, escapeRegex } from '../utils/pagination.js';
import { computeAvailableSlots, assertSlotAvailable, staffOffersService } from '../utils/availability.js';
import { combineDateTime, toMinutes, toHHMM, formatDateBg, dayOfWeek, todayStr } from '../utils/time.js';

const POPULATE = [
  { path: 'service', select: 'title price duration category image' },
  { path: 'staff', select: 'name position' },
  { path: 'client', select: 'name email phone' },
];

const STATUS_MESSAGES = {
  confirmed: 'Резервацията е потвърдена. Клиентът ще бъде доволен!',
  completed: 'Резервацията е отбелязана като завършена. Браво!',
  cancelled: 'Резервацията е отказана.',
  pending: 'Резервацията е върната в статус „Чакаща“.',
};

// Allowed transitions for staff/admin
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled', 'completed'],
  confirmed: ['completed', 'cancelled', 'pending'],
  cancelled: ['pending', 'confirmed'], // admin only (re-open)
  completed: ['confirmed'], // admin only (undo)
};

const loadService = async (serviceId) => {
  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) {
    throw ApiError.notFound('Тази услуга вече не е налична.', [{ field: 'serviceId', message: 'Услугата не е налична' }]);
  }
  return service;
};

const loadStaff = async (staffId) => {
  const staff = await User.findOne({ _id: staffId, role: 'staff', isActive: true });
  if (!staff) {
    throw ApiError.notFound('Избраният служител не е наличен.', [{ field: 'staffId', message: 'Служителят не е наличен' }]);
  }
  return staff;
};

const assertStaffOffers = (staff, service) => {
  if (!staffOffersService(staff, service._id)) {
    throw ApiError.badRequest(`${staff.name} не предлага услугата „${service.title}“.`, [
      { field: 'staffId', message: 'Този служител не предлага избраната услуга' },
    ]);
  }
};

const assertFuture = (date, time) => {
  if (combineDateTime(date, time) <= new Date()) {
    throw ApiError.badRequest('Датата и часът трябва да са в бъдещето.', [
      { field: 'date', message: 'Избери бъдеща дата и час' },
    ]);
  }
};

const canAccess = (user, booking) => {
  if (user.role === 'admin') return true;
  if (user.role === 'staff') return String(booking.staff?._id || booking.staff) === String(user._id);
  return booking.client && String(booking.client?._id || booking.client) === String(user._id);
};

/** GET /api/bookings/availability?serviceId&staffId&date[&excludeId] – public */
export const getAvailability = asyncHandler(async (req, res) => {
  const { serviceId, staffId, date, excludeId } = req.query;
  const [service, staff] = await Promise.all([loadService(serviceId), loadStaff(staffId)]);
  assertStaffOffers(staff, service);

  const isWorkingDay = staff.workingDays.includes(dayOfWeek(date));
  const slots = date < todayStr() ? [] : await computeAvailableSlots({ staff, duration: service.duration, date, excludeBookingId: excludeId || null });

  let message;
  if (date < todayStr()) message = 'Тази дата вече е минала. Избери бъдеща дата.';
  else if (!isWorkingDay) message = `${staff.name} не работи в този ден. Избери друга дата.`;
  else if (!slots.length) message = 'За тази дата няма свободни часове. Пробвай друг ден.';
  else message = `Намерихме ${slots.length} свободни ${slots.length === 1 ? 'час' : 'часа'}.`;

  return ApiResponse.ok(res, message, {
    date,
    isWorkingDay,
    slots,
    workStart: staff.workStart,
    workEnd: staff.workEnd,
    duration: service.duration,
    staff: { _id: staff._id, name: staff.name },
  });
});

/** POST /api/bookings – any logged-in user */
export const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, staffId, date, time, notes } = req.body;
  const [service, staff] = await Promise.all([loadService(serviceId), loadStaff(staffId)]);
  assertStaffOffers(staff, service);
  assertFuture(date, time);
  await assertSlotAvailable({ staff, date, time, duration: service.duration });

  const isManager = ['admin', 'staff'].includes(req.user.role);
  const isWalkIn = isManager && req.body.clientName && String(req.body.clientName).trim();

  const clientData = isWalkIn
    ? {
        client: null,
        clientName: String(req.body.clientName).trim(),
        clientEmail: req.body.clientEmail ? String(req.body.clientEmail).trim() : '',
        clientPhone: req.body.clientPhone ? String(req.body.clientPhone).trim() : '',
      }
    : {
        client: req.user._id,
        clientName: req.user.name,
        clientEmail: req.user.email,
        clientPhone: req.user.phone || '',
      };

  const booking = await Booking.create({
    ...clientData,
    service: service._id,
    serviceTitle: service.title,
    staff: staff._id,
    staffName: staff.name,
    date,
    time,
    endTime: toHHMM(toMinutes(time) + service.duration),
    startAt: combineDateTime(date, time),
    duration: service.duration,
    price: service.price,
    status: isManager && req.body.status === 'confirmed' ? 'confirmed' : 'pending',
    notes: notes ? String(notes).trim() : '',
    createdBy: req.user._id,
  });

  await booking.populate(POPULATE);

  const message = isWalkIn
    ? `Готово! Резервацията за ${booking.clientName} е създадена за ${formatDateBg(date)} в ${time}.`
    : `Готово! Резервацията ти е запазена за ${formatDateBg(date)} в ${time} при ${staff.name}.`;

  return ApiResponse.created(res, message, booking);
});

/** GET /api/bookings – role-scoped list with search, filters & pagination */
export const listBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10, 100);
  const { search, status, scope, staffId, from, to, sort } = req.query;
  const now = new Date();

  const filter = {};
  if (req.user.role === 'client') filter.client = req.user._id;
  else if (req.user.role === 'staff') filter.staff = req.user._id;
  else if (staffId && mongoose.isValidObjectId(staffId)) filter.staff = staffId;

  if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) filter.status = status;

  if (scope === 'upcoming') {
    filter.startAt = { $gte: now };
    if (!filter.status) filter.status = { $in: ACTIVE_STATUSES };
  } else if (scope === 'past') {
    filter.startAt = { $lt: now };
  }

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = String(from);
    if (to) filter.date.$lte = String(to);
  }

  if (search && String(search).trim()) {
    const rx = { $regex: escapeRegex(String(search).trim()), $options: 'i' };
    filter.$or = [{ clientName: rx }, { clientEmail: rx }, { clientPhone: rx }, { serviceTitle: rx }, { staffName: rx }];
  }

  const sortMap = {
    date_asc: { startAt: 1 },
    date_desc: { startAt: -1 },
    newest: { createdAt: -1 },
  };
  const sortBy = sortMap[sort] || (scope === 'upcoming' ? sortMap.date_asc : sortMap.date_desc);

  const [items, total] = await Promise.all([
    Booking.find(filter).sort(sortBy).skip(skip).limit(limit).populate(POPULATE).lean(),
    Booking.countDocuments(filter),
  ]);

  const message = total ? `Заредихме ${total} ${total === 1 ? 'резервация' : 'резервации'}.` : 'Все още няма резервации тук.';
  return ApiResponse.ok(res, message, items, buildPaginationMeta(page, limit, total));
});

/** GET /api/bookings/stats – admin & staff dashboard */
export const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const base = req.user.role === 'staff' ? { staff: req.user._id } : {};
  const monthPrefix = todayStr().slice(0, 7);

  const [
    totalBookings,
    upcomingCount,
    pendingCount,
    completedCount,
    cancelledCount,
    revenueAgg,
    monthRevenueAgg,
    expectedAgg,
    upcoming,
    totalClients,
    totalServices,
    totalStaff,
  ] = await Promise.all([
    Booking.countDocuments(base),
    Booking.countDocuments({ ...base, startAt: { $gte: now }, status: { $in: ACTIVE_STATUSES } }),
    Booking.countDocuments({ ...base, status: 'pending', startAt: { $gte: now } }),
    Booking.countDocuments({ ...base, status: 'completed' }),
    Booking.countDocuments({ ...base, status: 'cancelled' }),
    Booking.aggregate([{ $match: { ...base, status: 'completed' } }, { $group: { _id: null, sum: { $sum: '$price' } } }]),
    Booking.aggregate([
      { $match: { ...base, status: 'completed', date: { $regex: `^${monthPrefix}` } } },
      { $group: { _id: null, sum: { $sum: '$price' } } },
    ]),
    Booking.aggregate([
      { $match: { ...base, status: { $in: ACTIVE_STATUSES }, startAt: { $gte: now } } },
      { $group: { _id: null, sum: { $sum: '$price' } } },
    ]),
    Booking.find({ ...base, startAt: { $gte: now }, status: { $in: ACTIVE_STATUSES } })
      .sort({ startAt: 1 })
      .limit(5)
      .populate(POPULATE)
      .lean(),
    req.user.role === 'admin'
      ? User.countDocuments({ role: 'client' })
      : Booking.distinct('clientName', base).then((list) => list.length),
    Service.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'staff', isActive: true }),
  ]);

  return ApiResponse.ok(res, 'Статистиката е заредена.', {
    totalBookings,
    upcomingCount,
    pendingCount,
    completedCount,
    cancelledCount,
    revenue: revenueAgg[0]?.sum || 0,
    revenueThisMonth: monthRevenueAgg[0]?.sum || 0,
    expectedRevenue: expectedAgg[0]?.sum || 0,
    totalClients,
    totalServices,
    totalStaff,
    upcoming,
  });
});

/** GET /api/bookings/:id */
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(POPULATE).lean();
  if (!booking || !canAccess(req.user, booking)) throw ApiError.notFound('Тази резервация не е намерена.');
  return ApiResponse.ok(res, 'Резервацията е заредена.', booking);
});

/** PATCH /api/bookings/:id/status */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking || !canAccess(req.user, booking)) throw ApiError.notFound('Тази резервация не е намерена.');

  if (booking.status === status) {
    throw ApiError.badRequest('Резервацията вече е в този статус.');
  }

  // Clients may only cancel their own upcoming bookings
  if (req.user.role === 'client') {
    if (status !== 'cancelled') throw ApiError.forbidden('Можеш само да откажеш своя резервация.');
    if (!ACTIVE_STATUSES.includes(booking.status)) {
      throw ApiError.badRequest('Тази резервация вече не може да бъде отказана.');
    }
    if (booking.startAt <= new Date()) throw ApiError.badRequest('Не можеш да откажеш резервация, която вече е минала.');

    booking.status = 'cancelled';
    await booking.save();
    await booking.populate(POPULATE);
    return ApiResponse.ok(res, 'Резервацията ти е отказана. Надяваме се да те видим скоро отново!', booking);
  }

  const allowed = TRANSITIONS[booking.status] || [];
  const adminOnly = ['cancelled', 'completed'].includes(booking.status);
  if (!allowed.includes(status) || (adminOnly && req.user.role !== 'admin')) {
    throw ApiError.badRequest('Тази промяна на статуса не е позволена.');
  }

  if (status === 'completed' && booking.startAt > new Date()) {
    throw ApiError.badRequest('Не можеш да завършиш резервация, която още не е започнала.');
  }

  // Re-opening a cancelled booking must re-check that the slot is still free
  if (booking.status === 'cancelled') {
    assertFuture(booking.date, booking.time);
    const staff = await User.findById(booking.staff);
    if (!staff) throw ApiError.notFound('Служителят по тази резервация вече не съществува.');
    await assertSlotAvailable({ staff, date: booking.date, time: booking.time, duration: booking.duration, excludeBookingId: booking._id });
  }

  booking.status = status;
  await booking.save();
  await booking.populate(POPULATE);
  return ApiResponse.ok(res, STATUS_MESSAGES[status], booking);
});

/** PUT /api/bookings/:id – admin full edit */
export const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Тази резервация не е намерена.');

  const serviceId = req.body.serviceId || booking.service;
  const staffId = req.body.staffId || booking.staff;
  const date = req.body.date || booking.date;
  const time = req.body.time || booking.time;

  const scheduleChanged =
    String(serviceId) !== String(booking.service) ||
    String(staffId) !== String(booking.staff) ||
    date !== booking.date ||
    time !== booking.time;

  const nextStatus = req.body.status || booking.status;

  if (scheduleChanged || (booking.status === 'cancelled' && nextStatus !== 'cancelled')) {
    const service = String(serviceId) !== String(booking.service) ? await loadService(serviceId) : await Service.findById(serviceId);
    if (!service) throw ApiError.notFound('Тази услуга вече не съществува.');
    const staff = await loadStaff(staffId);
    assertStaffOffers(staff, service);
    if (scheduleChanged) assertFuture(date, time);
    if (nextStatus !== 'cancelled') {
      await assertSlotAvailable({ staff, date, time, duration: service.duration, excludeBookingId: booking._id });
    }

    Object.assign(booking, {
      service: service._id,
      serviceTitle: service.title,
      staff: staff._id,
      staffName: staff.name,
      date,
      time,
      endTime: toHHMM(toMinutes(time) + service.duration),
      startAt: combineDateTime(date, time),
      duration: service.duration,
      price: String(service._id) !== String(booking.service) ? service.price : booking.price,
    });
  }

  if (req.body.status) booking.status = req.body.status;
  if (req.body.notes !== undefined) booking.notes = String(req.body.notes).trim();
  if (!booking.client) {
    if (req.body.clientName) booking.clientName = String(req.body.clientName).trim();
    if (req.body.clientEmail !== undefined) booking.clientEmail = String(req.body.clientEmail).trim();
    if (req.body.clientPhone !== undefined) booking.clientPhone = String(req.body.clientPhone).trim();
  }
  if (req.body.price !== undefined) booking.price = Number(req.body.price);

  await booking.save();
  await booking.populate(POPULATE);
  return ApiResponse.ok(res, 'Промените по резервацията са запазени.', booking);
});

/** DELETE /api/bookings/:id – admin */
export const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Тази резервация не е намерена.');
  await booking.deleteOne();
  return ApiResponse.ok(res, 'Резервацията е изтрита завинаги.', { _id: booking._id });
});
