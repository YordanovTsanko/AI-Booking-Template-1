import { Router } from 'express';
import { register, login, logout, getMe, updateMe } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { validate, rules as r } from '../middlewares/validate.middleware.js';
import { authLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

const PHONE_REGEX = /^[+\d\s()-]{6,20}$/;

const registerSchema = {
  name: [
    r.required('Името е задължително'),
    r.string(),
    r.minLength(2, 'Името трябва да е поне 2 символа'),
    r.maxLength(60, 'Името може да е най-много 60 символа'),
  ],
  email: [r.required('Имейлът е задължителен'), r.string(), r.email('Въведи валиден имейл адрес')],
  password: [
    r.required('Паролата е задължителна'),
    r.string(),
    r.minLength(6, 'Паролата трябва да е поне 6 символа'),
    r.maxLength(100, 'Паролата може да е най-много 100 символа'),
  ],
  phone: [r.optional(), r.string(), r.matches(PHONE_REGEX, 'Въведи валиден телефонен номер')],
};

const loginSchema = {
  email: [r.required('Имейлът е задължителен'), r.string(), r.email('Въведи валиден имейл адрес')],
  password: [r.required('Паролата е задължителна'), r.string()],
};

const updateMeSchema = {
  name: [r.optional(), r.string(), r.minLength(2, 'Името трябва да е поне 2 символа'), r.maxLength(60, 'Името може да е най-много 60 символа')],
  phone: [r.optional(), r.string(), r.matches(PHONE_REGEX, 'Въведи валиден телефонен номер')],
};

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/me', protect, validate(updateMeSchema), updateMe);

export default router;
