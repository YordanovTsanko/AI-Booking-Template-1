import Service from '../models/Service.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPaginationMeta, escapeRegex } from '../utils/pagination.js';

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1, title: 1 },
  price_desc: { price: -1, title: 1 },
  duration_asc: { duration: 1, title: 1 },
  duration_desc: { duration: -1, title: 1 },
  title_asc: { title: 1 },
};

const SERVICE_FIELDS = ['title', 'description', 'price', 'duration', 'category', 'image', 'isActive'];

const pickServiceFields = (body) => {
  const data = {};
  for (const key of SERVICE_FIELDS) {
    if (body[key] !== undefined) data[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
  }
  if (data.price !== undefined) data.price = Number(data.price);
  if (data.duration !== undefined) data.duration = Number(data.duration);
  return data;
};

/** GET /api/services – public, paginated, search, category filter, sorting */
export const listServices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 9, 100);
  const { search, category, sort } = req.query;

  const filter = {};
  const isAdmin = req.user?.role === 'admin';
  if (!(isAdmin && req.query.includeInactive === 'true')) filter.isActive = true;
  if (search && String(search).trim()) filter.title = { $regex: escapeRegex(String(search).trim()), $options: 'i' };
  if (category && String(category).trim()) filter.category = String(category).trim();

  const sortBy = SORT_MAP[sort] || SORT_MAP.newest;

  const [items, total] = await Promise.all([
    Service.find(filter).sort(sortBy).skip(skip).limit(limit).lean(),
    Service.countDocuments(filter),
  ]);

  const message = total
    ? `Намерихме ${total} ${total === 1 ? 'услуга' : 'услуги'}.`
    : 'Няма намерени услуги по тези критерии.';

  return ApiResponse.ok(res, message, items, buildPaginationMeta(page, limit, total));
});

/** GET /api/services/categories */
export const listCategories = asyncHandler(async (req, res) => {
  const filter = req.user?.role === 'admin' ? {} : { isActive: true };
  const categories = (await Service.distinct('category', filter)).filter(Boolean).sort((a, b) => a.localeCompare(b, 'bg'));
  return ApiResponse.ok(res, 'Категориите са заредени.', categories);
});

/** GET /api/services/:id */
export const getService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).lean();
  if (!service || (!service.isActive && req.user?.role !== 'admin')) {
    throw ApiError.notFound('Тази услуга не е намерена или вече не се предлага.');
  }
  return ApiResponse.ok(res, 'Услугата е заредена.', service);
});

/** POST /api/services – admin */
export const createService = asyncHandler(async (req, res) => {
  const service = await Service.create(pickServiceFields(req.body));
  return ApiResponse.created(res, `Готово! Услугата „${service.title}“ е създадена.`, service);
});

/** PUT /api/services/:id – admin */
export const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw ApiError.notFound('Тази услуга не е намерена.');

  Object.assign(service, pickServiceFields(req.body));
  await service.save();

  // Keep snapshot titles in future bookings in sync
  await Booking.updateMany(
    { service: service._id, startAt: { $gte: new Date() } },
    { $set: { serviceTitle: service.title } }
  );

  return ApiResponse.ok(res, `Промените по „${service.title}“ са запазени.`, service);
});

/** DELETE /api/services/:id – admin */
export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) throw ApiError.notFound('Тази услуга не е намерена.');

  const upcoming = await Booking.countDocuments({
    service: service._id,
    status: { $in: ['pending', 'confirmed'] },
    startAt: { $gte: new Date() },
  });
  if (upcoming > 0) {
    throw ApiError.conflict(
      `Услугата има ${upcoming} предстоящи резервации. Откажи ги или я направи неактивна, вместо да я триеш.`
    );
  }

  await service.deleteOne();
  await User.updateMany({ services: service._id }, { $pull: { services: service._id } });

  return ApiResponse.ok(res, `Услугата „${service.title}“ е изтрита.`, { _id: service._id });
});
