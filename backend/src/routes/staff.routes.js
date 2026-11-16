import { Router } from 'express';
import mongoose from 'mongoose';
import { listStaff, getStaffMember, createStaff, updateStaff, deleteStaff } from '../controllers/staff.controller.js';
import { protect, optionalAuth, authorize } from '../middlewares/auth.middleware.js';
import { validate, partial, rules as r } from '../middlewares/validate.middleware.js';

const router = Router();

const staffSchema = {
  name: [r.required('Името е задължително'), r.string(), r.minLength(2, 'Името трябва да е поне 2 символа'), r.maxLength(60, 'Името може да е най-много 60 символа')],
  email: [r.required('Имейлът е задължителен'), r.string(), r.email('Въведи валиден имейл адрес')],
  password: [r.required('Паролата е задължителна'), r.string(), r.minLength(6, 'Паролата трябва да е поне 6 символа')],
  phone: [r.optional(), r.string(), r.matches(/^[+\d\s()-]{6,20}$/, 'Въведи валиден телефонен номер')],
  position: [r.optional(), r.string(), r.maxLength(60, 'Позицията може да е най-много 60 символа')],
  bio: [r.optional(), r.string(), r.maxLength(500, 'Описанието може да е най-много 500 символа')],
  avatar: [r.optional(), r.string(), r.url()],
  services: [r.optional(), r.array('Услугите трябва да са списък'), r.arrayOf((id) => mongoose.isValidObjectId(id), 'Невалидна услуга в списъка')],
  workingDays: [
    r.optional(),
    r.array('Работните дни трябва да са списък'),
    r.arrayOf((d) => Number.isInteger(Number(d)) && Number(d) >= 0 && Number(d) <= 6, 'Невалиден работен ден'),
  ],
  workStart: [r.optional(), r.time('Невалиден начален час')],
  workEnd: [r.optional(), r.time('Невалиден краен час')],
  isActive: [r.optional(), r.boolean()],
};

const idParam = { id: [r.objectId('Невалиден идентификатор на служител')] };
const listQuery = { serviceId: [r.optional(), r.objectId('Невалиден идентификатор на услуга')] };

router.get('/', optionalAuth, validate(listQuery, 'query'), listStaff);
router.get('/:id', optionalAuth, validate(idParam, 'params'), getStaffMember);

router.post('/', protect, authorize('admin'), validate(staffSchema), createStaff);
router.put('/:id', protect, authorize('admin'), validate(idParam, 'params'), validate(partial(staffSchema)), updateStaff);
router.delete('/:id', protect, authorize('admin'), validate(idParam, 'params'), deleteStaff);

export default router;
