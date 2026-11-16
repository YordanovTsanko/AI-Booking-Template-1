import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import { isValidDateStr, isValidTimeStr } from '../utils/time.js';

const SKIP = Symbol('skip');

const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/**
 * Rule factories. Each rule receives (value, data) and returns
 * an error message string, null (ok) or SKIP (stop checking this field).
 */
export const rules = {
  optional: () => (v) => (isEmpty(v) ? SKIP : null),
  required: (msg) => (v) => (isEmpty(v) ? msg : null),
  string: (msg = 'Трябва да е текст') => (v) => (typeof v === 'string' ? null : msg),
  email: (msg = 'Въведи валиден имейл адрес') => (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? null : msg,
  minLength: (n, msg) => (v) => (String(v).trim().length >= n ? null : msg),
  maxLength: (n, msg) => (v) => (String(v).trim().length <= n ? null : msg),
  number: (msg = 'Трябва да е число') => (v) =>
    v !== '' && v !== null && typeof v !== 'boolean' && Number.isFinite(Number(v)) ? null : msg,
  integer: (msg = 'Трябва да е цяло число') => (v) => (Number.isInteger(Number(v)) ? null : msg),
  min: (n, msg) => (v) => (Number(v) >= n ? null : msg),
  max: (n, msg) => (v) => (Number(v) <= n ? null : msg),
  boolean: (msg = 'Трябва да е да/не') => (v) => (typeof v === 'boolean' ? null : msg),
  oneOf: (list, msg) => (v) => (list.includes(v) ? null : msg),
  matches: (regex, msg) => (v) => (regex.test(String(v)) ? null : msg),
  objectId: (msg = 'Невалиден идентификатор') => (v) => (mongoose.isValidObjectId(v) ? null : msg),
  date: (msg = 'Невалидна дата (очаква се ГГГГ-ММ-ДД)') => (v) => (isValidDateStr(v) ? null : msg),
  time: (msg = 'Невалиден час (очаква се ЧЧ:ММ)') => (v) => (isValidTimeStr(v) ? null : msg),
  url: (msg = 'Въведи валиден адрес на изображение (http/https)') => (v) =>
    /^(https?:\/\/|\/)[^\s]+$/i.test(String(v).trim()) ? null : msg,
  array: (msg = 'Трябва да е списък') => (v) => (Array.isArray(v) ? null : msg),
  arrayOf: (check, msg) => (v) => (Array.isArray(v) && v.every(check) ? null : msg),
  custom: (fn) => fn,
};

/**
 * Validates req[source] against a schema: { field: [rule, rule, ...] }.
 * On failure → 400 with a field-specific errors array.
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const data = req[source] && typeof req[source] === 'object' ? req[source] : {};
  const errors = [];

  for (const [field, fieldRules] of Object.entries(schema)) {
    for (const rule of fieldRules) {
      const result = rule(data[field], data, req);
      if (result === SKIP) break;
      if (result) {
        errors.push({ field, message: result });
        break;
      }
    }
  }

  if (errors.length) {
    return next(
      ApiError.badRequest(
        errors.length === 1 ? errors[0].message : 'Моля, провери отбелязаните полета – има неща за оправяне.',
        errors
      )
    );
  }
  next();
};

/** Makes every field in a schema optional (for PATCH/PUT updates). */
export const partial = (schema) =>
  Object.fromEntries(Object.entries(schema).map(([field, fieldRules]) => [field, [rules.optional(), ...fieldRules]]));
