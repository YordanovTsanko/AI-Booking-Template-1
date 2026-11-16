import { Router } from 'express';
import { generateDescription, chat } from '../controllers/ai.controller.js';
import { protect, optionalAuth, authorize } from '../middlewares/auth.middleware.js';
import { validate, rules as r } from '../middlewares/validate.middleware.js';
import { aiLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

const descriptionSchema = {
  title: [r.required('Въведи име на услугата, за да генерирам описание'), r.string(), r.minLength(2, 'Името трябва да е поне 2 символа'), r.maxLength(100, 'Името може да е най-много 100 символа')],
  category: [r.optional(), r.string(), r.maxLength(50, 'Категорията може да е най-много 50 символа')],
};

const chatSchema = {
  message: [r.required('Напиши съобщение'), r.string(), r.maxLength(500, 'Съобщението може да е най-много 500 символа')],
  sessionId: [r.optional(), r.string(), r.maxLength(100)],
  history: [r.optional(), r.array()],
};

router.post('/generate-description', aiLimiter, protect, authorize('admin'), validate(descriptionSchema), generateDescription);
router.post('/chat', aiLimiter, optionalAuth, validate(chatSchema), chat);

export default router;
