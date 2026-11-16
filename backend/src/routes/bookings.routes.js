import { Router } from 'express';
import {
  getAvailability,
  createBooking,
  listBookings,
  getStats,
  getBooking,
  updateBookingStatus,
  updateBooking,
  deleteBooking,
} from '../controllers/bookings.controller.js';
import { protect, authorize } from '../middlewares/auth.middleware.js';
import { validate, rules as r } from '../middlewares/validate.middleware.js';
import { BOOKING_STATUSES } from '../models/Booking.js';

const router = Router();

const availabilityQuery = {
  serviceId: [r.required('Избери услуга'), r.objectId('Невалидна услуга')],
  staffId: [r.required('Избери служител'), r.objectId('Невалиден служител')],
  date: [r.required('Избери дата'), r.date()],
  excludeId: [r.optional(), r.objectId()],
};

const createSchema = {
  serviceId: [r.required('Избери услуга'), r.objectId('Невалидна услуга')],
  staffId: [r.required('Избери служител'), r.objectId('Невалиден служител')],
  date: [r.required('Избери дата'), r.date()],
  time: [r.required('Избери час'), r.time()],
  notes: [r.optional(), r.string(), r.maxLength(500, 'Бележката може да е най-много 500 символа')],
  clientName: [r.optional(), r.string(), r.minLength(2, 'Името трябва да е поне 2 символа'), r.maxLength(60, 'Името може да е най-много 60 символа')],
  clientEmail: [r.optional(), r.string(), r.email()],
  clientPhone: [r.optional(), r.string(), r.matches(/^[+\d\s()-]{6,20}$/, 'Въведи валиден телефонен номер')],
  status: [r.optional(), r.oneOf(['pending', 'confirmed'], 'Невалиден статус')],
};

const updateSchema = {
  serviceId: [r.optional(), r.objectId('Невалидна услуга')],
  staffId: [r.optional(), r.objectId('Невалиден служител')],
  date: [r.optional(), r.date()],
  time: [r.optional(), r.time()],
  status: [r.optional(), r.oneOf(BOOKING_STATUSES, 'Невалиден статус')],
  notes: [r.optional(), r.string(), r.maxLength(500, 'Бележката може да е най-много 500 символа')],
  clientName: [r.optional(), r.string(), r.minLength(2, 'Името трябва да е поне 2 символа')],
  clientEmail: [r.optional(), r.string(), r.email()],
  clientPhone: [r.optional(), r.string(), r.matches(/^[+\d\s()-]{6,20}$/, 'Въведи валиден телефонен номер')],
  price: [r.optional(), r.number('Цената трябва да е число'), r.min(0, 'Цената не може да е отрицателна')],
};

const statusSchema = {
  status: [r.required('Избери статус'), r.oneOf(BOOKING_STATUSES, 'Невалиден статус')],
};

const idParam = { id: [r.objectId('Невалиден идентификатор на резервация')] };

// Public
router.get('/availability', validate(availabilityQuery, 'query'), getAvailability);

// Authenticated
router.use(protect);
router.get('/', listBookings);
router.get('/stats', authorize('admin', 'staff'), getStats);
router.post('/', validate(createSchema), createBooking);
router.get('/:id', validate(idParam, 'params'), getBooking);
router.patch('/:id/status', validate(idParam, 'params'), validate(statusSchema), updateBookingStatus);
router.put('/:id', authorize('admin'), validate(idParam, 'params'), validate(updateSchema), updateBooking);
router.delete('/:id', authorize('admin'), validate(idParam, 'params'), deleteBooking);

export default router;
