import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { toMinutes } from '../utils/time.js';

const PUBLIC_FIELDS = 'name position bio avatar services workingDays workStart workEnd isActive';
const ADMIN_FIELDS = `${PUBLIC_FIELDS} email phone role createdAt`;

const buildStaffData = async (body, { isCreate }) => {
  const data = {};
  ['name', 'email', 'phone', 'position', 'bio', 'avatar', 'workStart', 'workEnd'].forEach((key) => {
    if (body[key] !== undefined) data[key] = String(body[key]).trim();
  });
  if (data.email) data.email = data.email.toLowerCase();
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.workingDays !== undefined) data.workingDays = [...new Set(body.workingDays.map(Number))].sort();

  if (body.services !== undefined) {
    const ids = [...new Set(body.services.map(String))];
    const count = await Service.countDocuments({ _id: { $in: ids } });
    if (count !== ids.length) {
      throw ApiError.badRequest('Някоя от избраните услуги не съществува.', [
        { field: 'services', message: 'Невалидна услуга' },
      ]);
    }
    data.services = ids;
  }
  if (isCreate || body.password) data.password = body.password;
  return data;
};

const assertWorkHours = (workStart, workEnd) => {
  if (toMinutes(workEnd) <= toMinutes(workStart)) {
    throw ApiError.badRequest('Краят на работния ден трябва да е след началото.', [
      { field: 'workEnd', message: 'Краят трябва да е след началото' },
    ]);
  }
};

/** GET /api/staff – public list (filter by ?serviceId). Admin can pass ?all=true */
export const listStaff = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const filter = { role: 'staff' };
  if (!(isAdmin && req.query.all === 'true')) filter.isActive = true;
  if (req.query.serviceId) {
    filter.$or = [{ services: req.query.serviceId }, { services: { $size: 0 } }];
  }

  const staff = await User.find(filter)
    .select(isAdmin ? ADMIN_FIELDS : PUBLIC_FIELDS)
    .populate('services', 'title')
    .sort({ name: 1 })
    .lean();

  const message = staff.length ? 'Служителите са заредени.' : 'Все още няма служители за тази услуга.';
  return ApiResponse.ok(res, message, staff);
});

/** GET /api/staff/:id */
export const getStaffMember = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const staff = await User.findOne({ _id: req.params.id, role: 'staff' })
    .select(isAdmin ? ADMIN_FIELDS : PUBLIC_FIELDS)
    .populate('services', 'title')
    .lean();
  if (!staff || (!staff.isActive && !isAdmin)) throw ApiError.notFound('Този служител не е намерен.');
  return ApiResponse.ok(res, 'Служителят е зареден.', staff);
});

/** POST /api/staff – admin */
export const createStaff = asyncHandler(async (req, res) => {
  const data = await buildStaffData(req.body, { isCreate: true });
  assertWorkHours(data.workStart || '09:00', data.workEnd || '18:00');

  if (await User.exists({ email: data.email })) {
    throw ApiError.conflict('Този имейл вече е зает', [{ field: 'email', message: 'Този имейл вече е зает' }]);
  }

  const staff = await User.create({ ...data, role: 'staff' });
  await staff.populate('services', 'title');
  return ApiResponse.created(res, `Готово! ${staff.name} вече е част от екипа.`, staff.toJSON());
});

/** PUT /api/staff/:id – admin */
export const updateStaff = asyncHandler(async (req, res) => {
  const staff = await User.findOne({ _id: req.params.id, role: 'staff' });
  if (!staff) throw ApiError.notFound('Този служител не е намерен.');

  const data = await buildStaffData(req.body, { isCreate: false });
  assertWorkHours(data.workStart || staff.workStart, data.workEnd || staff.workEnd);

  if (data.email && data.email !== staff.email && (await User.exists({ email: data.email }))) {
    throw ApiError.conflict('Този имейл вече е зает', [{ field: 'email', message: 'Този имейл вече е зает' }]);
  }

  Object.assign(staff, data);
  await staff.save();
  await staff.populate('services', 'title');

  if (data.name) {
    await Booking.updateMany({ staff: staff._id, startAt: { $gte: new Date() } }, { $set: { staffName: staff.name } });
  }

  return ApiResponse.ok(res, `Данните на ${staff.name} са обновени.`, staff.toJSON());
});

/** DELETE /api/staff/:id – admin */
export const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await User.findOne({ _id: req.params.id, role: 'staff' });
  if (!staff) throw ApiError.notFound('Този служител не е намерен.');

  const upcoming = await Booking.countDocuments({
    staff: staff._id,
    status: { $in: ['pending', 'confirmed'] },
    startAt: { $gte: new Date() },
  });
  if (upcoming > 0) {
    throw ApiError.conflict(
      `${staff.name} има ${upcoming} предстоящи резервации. Откажи ги или деактивирай служителя, вместо да го триеш.`
    );
  }

  await staff.deleteOne();
  return ApiResponse.ok(res, `${staff.name} е премахнат(а) от екипа.`, { _id: staff._id });
});
