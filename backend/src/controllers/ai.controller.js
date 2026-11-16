import Service from '../models/Service.js';
import User from '../models/User.js';
import AIChatMessage from '../models/AIChatMessage.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { hasGroq, callGroq } from '../utils/groq.js';
import { computeAvailableSlots, staffOffersService } from '../utils/availability.js';
import {
  todayStr,
  addDays,
  dayOfWeek,
  isValidDateStr,
  isValidTimeStr,
  toMinutes,
  matchesPartOfDay,
  formatDateBg,
  formatPrice,
  formatDuration,
  PART_OF_DAY,
  pad,
} from '../utils/time.js';

/* =========================================================================
 *  1) SERVICE DESCRIPTION GENERATOR
 * ========================================================================= */

const DESCRIPTION_TEMPLATES = [
  {
    keys: ['подстриг', 'прическ', 'коса', 'фейд', 'fade', 'стайлинг'],
    text: (t) =>
      `${t} – прецизна работа от опитен майстор, съобразена с формата на лицето и личния ти стил. Започваме с кратка консултация, след това измиване, подстригване и финално оформяне с професионални стайлинг продукти. Излизаш свеж, подреден и уверен – готов за всеки повод.`,
  },
  {
    keys: ['брад', 'бръсн', 'мустак'],
    text: (t) =>
      `${t} – класическа бръснарска грижа с модерен подход. Оформяме контура с бръснач, изравняваме дължината и подхранваме кожата с горещ компрес и висококачествени масла. Резултатът е чиста, поддържана визия, която се забелязва от пръв поглед.`,
  },
  {
    keys: ['маникюр', 'педикюр', 'нокт', 'гел', 'лак'],
    text: (t) =>
      `${t} – безупречни ръце и нокти благодарение на внимателна обработка и качествени продукти. Почистваме, оформяме и подхранваме, а след това нанасяме покритие, което издържа дълго и изглежда перфектно. Отпусни се и се наслади на момент само за теб.`,
  },
  {
    keys: ['боядис', 'кичур', 'балеаж', 'цвят', 'тониране'],
    text: (t) =>
      `${t} – жив, наситен и траен цвят, подбран специално за теб. Работим с щадящи бои от професионални марки и съобразяваме нюанса с тена и стила ти. Процедурата включва грижа за косата, за да остане мека, блестяща и здрава.`,
  },
  {
    keys: ['масаж', 'спа', 'релакс', 'терапия'],
    text: (t) =>
      `${t} – пълноценна почивка за тялото и ума. Опитни ръце освобождават напрежението в мускулите, подобряват кръвообращението и възвръщат енергията ти. Идеалният начин да презаредиш след напрегната седмица.`,
  },
  {
    keys: ['мивк', 'измиван', 'кола', 'автомоб', 'полир', 'детайл', 'тапицер', 'интериор'],
    text: (t) =>
      `${t} – автомобилът ти отново блести като нов. Използваме безопасни за боята препарати, мека техника на измиване и внимание към всеки детайл – от джантите до последния ъгъл на купето. Бързо, качествено и без компромиси.`,
  },
  {
    keys: ['фото', 'снимк', 'сесия', 'портрет', 'студио'],
    text: (t) =>
      `${t} – професионални кадри в уютна студийна атмосфера. Фотографът ще те насочва през цялата сесия, за да се чувстваш естествено и уверено пред обектива. Получаваш внимателно обработени снимки с високо качество, готови за печат и социални мрежи.`,
  },
  {
    keys: ['грим', 'вежди', 'мигли', 'козмет', 'лице', 'почистван', 'епилац'],
    text: (t) =>
      `${t} – козметична процедура, която подчертава естествената ти красота. Работим с хипоалергенни продукти и стерилни инструменти, а всяка стъпка е съобразена с типа на кожата ти. Резултатът е свежа, поддържана и сияйна визия.`,
  },
];

const mockDescription = (title, category = '') => {
  const haystack = `${title} ${category}`.toLowerCase();
  const template = DESCRIPTION_TEMPLATES.find((tpl) => tpl.keys.some((k) => haystack.includes(k)));
  if (template) return template.text(title);
  return `${title} – услуга, изпълнена с внимание към всеки детайл от нашия екип от професионалисти. Използваме качествени продукти и модерно оборудване, за да получиш отличен резултат още от първото посещение. Резервирай онлайн за секунди и избери удобен за теб час.`;
};

/** POST /api/ai/generate-description */
export const generateDescription = asyncHandler(async (req, res) => {
  const title = String(req.body.title).trim();
  const category = req.body.category ? String(req.body.category).trim() : '';

  let description = null;
  let source = 'mock';

  if (hasGroq()) {
    try {
      description = await callGroq({
        messages: [
          {
            role: 'system',
            content:
              'Ти си копирайтър за малък бизнес за услуги (бръснарница, салон, автомивка, фото студио). Пишеш кратки, продаващи и приятелски описания на български език. Без емоджита, без кавички, без заглавие. 2–4 изречения, максимум 450 знака.',
          },
          {
            role: 'user',
            content: `Напиши описание за услугата „${title}“${category ? ` от категория „${category}“` : ''}.`,
          },
        ],
        maxTokens: 300,
        temperature: 0.8,
      });
      source = 'groq';
    } catch (err) {
      console.warn(`⚠️  Groq description failed, using mock: ${err.message}`);
    }
  }

  if (!description) description = mockDescription(title, category);

  return ApiResponse.ok(res, 'Описанието е готово! Можеш да го редактираш преди да запазиш.', {
    description: description.replace(/^["„“]+|["„“]+$/g, '').trim(),
    source,
  });
});

/* =========================================================================
 *  2) BOOKING CHAT ASSISTANT
 * ========================================================================= */

const DAY_PATTERNS = [
  { re: /понеделни/, day: 1 },
  { re: /вторни/, day: 2 },
  { re: /сряда|сряд/, day: 3 },
  { re: /четвърт/, day: 4 },
  { re: /петък|петъ/, day: 5 },
  { re: /събот/, day: 6 },
  { re: /недел/, day: 0 },
];

const SYNONYMS = [
  ['подстриг', 'прическ', 'коса', 'косата', 'фейд', 'fade'],
  ['брада', 'брадат', 'бръсн', 'мустак'],
  ['маникюр', 'нокти', 'нокът', 'гел', 'лак'],
  ['педикюр', 'крака', 'стъпала'],
  ['боядис', 'цвят', 'кичур', 'балеаж'],
  ['масаж', 'релакс'],
  ['измив', 'мивка', 'кола', 'колата', 'автомоб', 'кола'],
  ['полир', 'детайл'],
  ['фото', 'снимк', 'сесия', 'портрет'],
  ['вежди', 'мигли', 'грим'],
  ['почистван', 'лице', 'козмет'],
];

const nextDateForWeekday = (weekday) => {
  const today = todayStr();
  for (let i = 0; i < 7; i += 1) {
    const d = addDays(today, i);
    if (dayOfWeek(d) === weekday) return d;
  }
  return today;
};

const parseDates = (text) => {
  const today = todayStr();
  if (text.includes('вдругиден')) return [addDays(today, 2)];
  if (text.includes('утре')) return [addDays(today, 1)];
  if (text.includes('днес')) return [today];

  const numeric = text.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);
  if (numeric) {
    const day = Number(numeric[1]);
    const month = Number(numeric[2]);
    let year = numeric[3] ? Number(numeric[3]) : new Date().getFullYear();
    if (year < 100) year += 2000;
    let candidate = `${year}-${pad(month)}-${pad(day)}`;
    if (isValidDateStr(candidate)) {
      if (!numeric[3] && candidate < today) candidate = `${year + 1}-${pad(month)}-${pad(day)}`;
      if (isValidDateStr(candidate) && candidate >= today) return [candidate];
    }
  }

  const days = DAY_PATTERNS.filter((p) => p.re.test(text)).map((p) => nextDateForWeekday(p.day));
  if (days.length) {
    // "следващия петък" → push one week ahead
    if (/следващ/.test(text)) return days.map((d) => addDays(d, 7));
    return [...new Set(days)].sort();
  }

  if (text.includes('следващата седмица')) {
    const daysUntilMonday = (8 - dayOfWeek(today)) % 7 || 7;
    const monday = addDays(today, daysUntilMonday);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }
  if (text.includes('тази седмица') || text.includes('уикенд')) {
    const range = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    return text.includes('уикенд') ? range.filter((d) => [0, 6].includes(dayOfWeek(d))) : range;
  }
  return null;
};

const parsePartOfDay = (text) => {
  if (/следоб[ея]д/.test(text)) return 'afternoon';
  if (/сутрин|рано|преди обед/.test(text)) return 'morning';
  if (/обед/.test(text)) return 'midday';
  if (/вечер|късно|след работа/.test(text)) return 'evening';
  return null;
};

const parseTime = (text) => {
  const m = text.match(/(?:в|към|около|за)\s*(\d{1,2})(?::|\.|\s*ч|\s*часа)?(\d{2})?/) || text.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = m[2] ? Number(m[2]) : 0;
  if (hours > 23 || minutes > 59 || hours < 6) return null;
  return `${pad(hours)}:${pad(minutes)}`;
};

const stem = (word) => word.slice(0, Math.min(word.length, 5));

const matchService = (text, services) => {
  if (!services.length) return null;
  const words = text.split(/[^a-zа-я0-9]+/i).filter((w) => w.length >= 4);
  const activeSynonymGroups = SYNONYMS.filter((group) => group.some((s) => text.includes(s)));

  let best = null;
  let bestScore = 0;
  for (const service of services) {
    const hay = `${service.title} ${service.category}`.toLowerCase();
    const titleWords = service.title.toLowerCase().split(/[^a-zа-я0-9]+/i).filter((w) => w.length >= 4);
    let score = 0;

    for (const w of words) {
      if (titleWords.some((tw) => tw.startsWith(stem(w)) || w.startsWith(stem(tw)))) score += 3;
      else if (hay.includes(stem(w))) score += 1;
    }
    for (const group of activeSynonymGroups) {
      if (group.some((s) => hay.includes(s))) score += 2;
    }
    // Prefer exact combos like "подстригване + брада" only when both are mentioned
    if (/\+|и /.test(service.title.toLowerCase()) && activeSynonymGroups.length < 2) score -= 1;

    if (score > bestScore) {
      bestScore = score;
      best = service;
    }
  }
  return bestScore >= 2 ? best : null;
};

const detectType = (text, hasService, hasDate) => {
  const isGreetingOnly = /^(здравей|здрасти|здрасте|здр|хей|добър ден|добро утро|добър вечер|привет|hello|hi|ехо)[\s!.,?]*$/.test(text);
  if (isGreetingOnly) return 'greeting';
  if (/откаж|отмен|анулир|изтрий резерв/.test(text)) return 'cancel';
  if (/работно време|работите ли|до колко работ|от колко работ|отворено|затворено/.test(text) && !hasService) return 'hours';
  if (/цена|цени|колко струва|колко е|струва|ценоразпис/.test(text) && !hasDate) return 'price';
  if (/какви услуги|какво предлагате|услугите|какво правите|списък/.test(text) && !hasService) return 'services';
  if (hasService || hasDate || /час|запаз|резерв|запиш|свободн|искам|мога ли|кога/.test(text)) return 'booking';
  return 'unknown';
};

const parseIntentMock = (message, history, services) => {
  const text = message.toLowerCase();
  let service = matchService(text, services);
  // Look back in the conversation for a service the user already mentioned
  if (!service && history.length) {
    const previousUserText = history.filter((h) => h.role === 'user').map((h) => h.content).join(' ').toLowerCase();
    service = matchService(previousUserText, services);
  }
  const dates = parseDates(text);
  const partOfDay = parsePartOfDay(text);
  const time = parseTime(text);
  const type = detectType(text, Boolean(matchService(text, services)), Boolean(dates || partOfDay || time));
  return { type, serviceId: service ? String(service._id) : null, dates, partOfDay, time, reply: null };
};

const parseIntentGroq = async (message, history, services) => {
  const today = todayStr();
  const serviceList = services.map((s) => ({ id: String(s._id), title: s.title, category: s.category, price: s.price, duration: s.duration }));

  const result = await callGroq({
    json: true,
    maxTokens: 350,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: `Ти си AI асистент за онлайн резервации на бизнес за услуги. Днес е ${today} (${formatDateBg(today)}).
Услуги (JSON): ${JSON.stringify(serviceList)}
Анализирай последното съобщение на клиента (и контекста) и върни САМО JSON със следните полета:
{
 "type": "booking" | "price" | "services" | "hours" | "cancel" | "greeting" | "unknown",
 "serviceId": id от списъка или null,
 "dates": масив от дати "YYYY-MM-DD" (бъдещи) или null,
 "partOfDay": "morning" | "midday" | "afternoon" | "evening" | null,
 "time": "HH:MM" или null,
 "reply": кратък приятелски отговор на български (1-2 изречения), използван само ако type е "unknown" или "greeting"
}`,
      },
      ...history.slice(-6).map((h) => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: String(h.content).slice(0, 500) })),
      { role: 'user', content: message },
    ],
  });

  const validTypes = ['booking', 'price', 'services', 'hours', 'cancel', 'greeting', 'unknown'];
  return {
    type: validTypes.includes(result.type) ? result.type : 'unknown',
    serviceId: serviceList.some((s) => s.id === result.serviceId) ? result.serviceId : null,
    dates: Array.isArray(result.dates) ? result.dates.filter((d) => isValidDateStr(d) && d >= today).slice(0, 7) : null,
    partOfDay: PART_OF_DAY[result.partOfDay] ? result.partOfDay : null,
    time: isValidTimeStr(result.time) ? result.time : null,
    reply: typeof result.reply === 'string' ? result.reply.slice(0, 600) : null,
  };
};

const listServicesText = (services, limit = 8) =>
  services
    .slice(0, limit)
    .map((s) => `• ${s.title} – ${formatPrice(s.price)}, ${formatDuration(s.duration)}`)
    .join('\n');

const findSuggestions = async ({ service, staffList, dates, partOfDay, time, max = 6 }) => {
  const eligibleStaff = staffList.filter((s) => staffOffersService(s, service._id));
  const suggestions = [];
  for (const date of dates) {
    for (const staff of eligibleStaff) {
      let slots = await computeAvailableSlots({ staff, duration: service.duration, date });
      slots = slots.filter((t) => matchesPartOfDay(t, partOfDay));
      if (time) {
        const target = toMinutes(time);
        slots = slots.filter((t) => Math.abs(toMinutes(t) - target) <= 90).sort((a, b) => Math.abs(toMinutes(a) - target) - Math.abs(toMinutes(b) - target));
      }
      slots.slice(0, 3).forEach((t) =>
        suggestions.push({
          serviceId: String(service._id),
          serviceTitle: service.title,
          staffId: String(staff._id),
          staffName: staff.name,
          date,
          time: t,
          label: `${formatDateBg(date)}, ${t} – ${staff.name}`,
        })
      );
      if (suggestions.length >= max) return suggestions.slice(0, max);
    }
  }
  return suggestions;
};

const nextDays = (count) => Array.from({ length: count }, (_, i) => addDays(todayStr(), i));

const buildChatResult = async (intent, services, staffList) => {
  const service = intent.serviceId ? services.find((s) => String(s._id) === intent.serviceId) : null;

  switch (intent.type) {
    case 'greeting':
      return {
        reply:
          intent.reply ||
          'Здравей! 👋 Аз съм AI асистентът за резервации. Кажи ми каква услуга искаш и кога ти е удобно – например „Искам подстригване в петък следобед“ – и веднага ще ти намеря свободни часове.',
        suggestions: [],
      };

    case 'services':
      return {
        reply: services.length
          ? `Ето какво предлагаме:\n${listServicesText(services)}\n\nНапиши ми коя услуга те интересува и кога ти е удобно 🙂`
          : 'В момента все още няма добавени услуги. Провери отново малко по-късно!',
        suggestions: [],
      };

    case 'price':
      if (service) {
        const suggestions = await findSuggestions({ service, staffList, dates: nextDays(7), partOfDay: null, time: null, max: 3 });
        return {
          reply: `„${service.title}“ струва ${formatPrice(service.price)} и отнема около ${formatDuration(service.duration)}.${
            suggestions.length ? ' Ето и няколко от най-близките свободни часове:' : ''
          }`,
          suggestions,
          service,
        };
      }
      return {
        reply: services.length ? `Ето нашите цени:\n${listServicesText(services)}` : 'Все още няма добавени услуги с цени.',
        suggestions: [],
      };

    case 'hours': {
      if (!staffList.length) return { reply: 'В момента няма информация за работното време.', suggestions: [] };
      const starts = staffList.map((s) => s.workStart).sort();
      const ends = staffList.map((s) => s.workEnd).sort();
      return {
        reply: `Работим от ${starts[0]} до ${ends[ends.length - 1]} ч. Точните часове зависят от служителя – кажи ми услуга и ден и ще ти покажа свободните часове.`,
        suggestions: [],
      };
    }

    case 'cancel':
      return {
        reply:
          'Можеш да откажеш резервация от „Моето табло“ – намери резервацията и натисни „Откажи“. Ако не си влязъл в профила си, първо влез. 🙂',
        suggestions: [],
      };

    case 'booking': {
      if (!service) {
        return {
          reply: services.length
            ? `С удоволствие ще ти намеря час! Коя услуга те интересува?\n${listServicesText(services)}`
            : 'Все още няма добавени услуги за резервация.',
          suggestions: [],
        };
      }

      const requestedDates = intent.dates?.length ? intent.dates : nextDays(14);
      let suggestions = await findSuggestions({ service, staffList, dates: requestedDates, partOfDay: intent.partOfDay, time: intent.time });
      const partLabel = intent.partOfDay ? ` ${PART_OF_DAY[intent.partOfDay].label}` : '';
      const header = `„${service.title}“ (${formatDuration(service.duration)}, ${formatPrice(service.price)})`;

      if (suggestions.length) {
        return {
          reply: `Чудесно! Намерих свободни часове за ${header}${partLabel}. Избери удобен час и ще те пренасоча към потвърждението:`,
          suggestions,
          service,
        };
      }

      // Nothing on requested days → offer nearest alternatives in the next 14 days
      suggestions = await findSuggestions({ service, staffList, dates: nextDays(14), partOfDay: intent.partOfDay, time: null });
      if (!suggestions.length && intent.partOfDay) {
        suggestions = await findSuggestions({ service, staffList, dates: nextDays(14), partOfDay: null, time: null });
      }
      const when = intent.dates?.length === 1 ? ` за ${formatDateBg(intent.dates[0])}` : '';
      return {
        reply: suggestions.length
          ? `Хм, ${when ? `${when.trim()}` : 'в избрания период'}${partLabel} няма свободни часове за ${header} 😕 Ето най-близките свободни:`
          : `За съжаление в следващите 2 седмици няма свободни часове за ${header}. Опитай с друга услуга или се свържи с нас.`,
        suggestions,
        service,
      };
    }

    default:
      return {
        reply:
          intent.reply ||
          'Мога да ти помогна да запазиш час, да видиш цени или услуги. Пробвай например: „Искам час в петък следобед“ или „Колко струва подстригване?“',
        suggestions: [],
      };
  }
};

const persistChat = async ({ sessionId, userId, message, reply, source, meta }) => {
  try {
    await AIChatMessage.insertMany([
      { sessionId, user: userId, role: 'user', content: message, source },
      { sessionId, user: userId, role: 'assistant', content: reply.slice(0, 4000), source, meta },
    ]);
  } catch (err) {
    console.warn(`⚠️  Could not persist AI chat: ${err.message}`);
  }
};

/** POST /api/ai/chat */
export const chat = asyncHandler(async (req, res) => {
  const message = String(req.body.message).trim();
  const sessionId = req.body.sessionId ? String(req.body.sessionId).slice(0, 100) : null;
  const history = Array.isArray(req.body.history)
    ? req.body.history
        .filter((h) => h && typeof h.content === 'string' && ['user', 'assistant'].includes(h.role))
        .slice(-8)
    : [];

  const [services, staffList] = await Promise.all([
    Service.find({ isActive: true }).select('title category price duration').sort({ title: 1 }).lean(),
    User.find({ role: 'staff', isActive: true }).select('name services workingDays workStart workEnd').lean(),
  ]);

  let intent = null;
  let source = 'mock';
  if (hasGroq()) {
    try {
      intent = await parseIntentGroq(message, history, services);
      source = 'groq';
    } catch (err) {
      console.warn(`⚠️  Groq chat failed, using mock: ${err.message}`);
    }
  }
  if (!intent) intent = parseIntentMock(message, history, services);

  const result = await buildChatResult(intent, services, staffList);

  await persistChat({
    sessionId,
    userId: req.user?._id || null,
    message,
    reply: result.reply,
    source,
    meta: { intent, suggestions: result.suggestions.length },
  });

  return ApiResponse.ok(res, 'Отговорът е готов.', {
    reply: result.reply,
    suggestions: result.suggestions,
    service: result.service
      ? { _id: result.service._id, title: result.service.title, price: result.service.price, duration: result.service.duration }
      : null,
    source,
  });
});
