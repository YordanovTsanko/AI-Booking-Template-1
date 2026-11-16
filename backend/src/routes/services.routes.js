import { Router } from 'express';
import {
  listServices,
  listCategories,
  getService,
  createService,
  updateService,
  deleteService,
} from '../controllers/services.controller.js';
import { protect, optionalAuth, authorize } from '../middlewares/auth.middleware.js';
import { validate, partial, rules as r } from '../middlewares/validate.middleware.js';

const router = Router();

const serviceSchema = {
  title: [
    r.required('Името на услугата е задължително'),
    r.string(),
    r.minLength(2, 'Името трябва да е поне 2 символа'),
    r.maxLength(100, 'Името може да е най-много 100 символа'),
  ],
  description: [r.optional(), r.string(), r.maxLength(2000, 'Описанието може да е най-много 2000 символа')],
  price: [r.required('Цената е задължителна'), r.number('Цената трябва да е число'), r.min(0, 'Цената не може да е отрицателна'), r.max(100000, 'Цената е твърде висока')],
  duration: [
    r.required('Продължителността е задължителна'),
    r.number('Продължителността трябва да е число'),
    r.integer('Продължителността трябва да е цяло число минути'),
    r.min(5, 'Продължителността трябва да е поне 5 минути'),
    r.max(600, 'Продължителността може да е най-много 600 минути'),
  ],
  category: [r.required('Категорията е задължителна'), r.string(), r.maxLength(50, 'Категорията може да е най-много 50 символа')],
  image: [r.optional(), r.string(), r.url()],
  isActive: [r.optional(), r.boolean('Статусът трябва да е да/не')],
};

const idParam = { id: [r.objectId('Невалиден идентификатор на услуга')] };

router.get('/', optionalAuth, listServices);
router.get('/categories', optionalAuth, listCategories);
router.get('/:id', optionalAuth, validate(idParam, 'params'), getService);

router.post('/', protect, authorize('admin'), validate(serviceSchema), createService);
router.put('/:id', protect, authorize('admin'), validate(idParam, 'params'), validate(partial(serviceSchema)), updateService);
router.delete('/:id', protect, authorize('admin'), validate(idParam, 'params'), deleteService);

export default router;
