# AI-Booking-Template-1

**Пълна AI система за онлайн резервации за бизнеси с услуги** – бръснарници, фризьорски салони, автомивки, студиа за красота, фото студиа.
Готов шаблон за продажба и повторна употреба (MERN stack: backend на JavaScript, frontend на TypeScript).

**Дизайн:** тъмна тема в бръснарско синьо и червено, анимиран бръснарски стълб (barber pole) и снимки от бръснарница.

---

## Какво прави

- **Собственикът (admin)** създава услуги (с цена, продължителност, категория, снимка), служители и тяхното работно време (дни + часове).
- **Клиентът** разглежда услугите, избира услуга → служител → дата и свободен час от календара и резервира (3 стъпки).
- **Администраторът** вижда табло с предстоящи резервации, приходи, клиенти, потвърждава/завършва/отказва, създава и редактира резервации.
- **Служителят** вижда своите часове и може да ги потвърждава, завършва и отказва.
- **AI асистент** (плаващ чат долу вдясно на всяка страница) разбира съобщения като *„искам час в петък следобед“* и предлага реални свободни часове – с един клик води към резервацията.
- **AI генератор на описания** – в админ панела с бутон „✨ Генерирай с AI“ се пише продаващо описание на услугата.
- AI работи с **OpenAI**, а ако няма ключ – с вграден **умен mock AI** на български. Приложението никога не се срива заради липсващ ключ.

---

## Функционалности

**Резервации**
- 3 стъпки: 1. Избери услуга → 2. Избери служител и дата → 3. Потвърди
- Календар с изключени неработни/минали дни, свободни часове, групирани по Сутрин / Следобед / Вечер
- Защита от двойни резервации (проверка за застъпване + уникален индекс в MongoDB)
- Проверка за бъдеща дата, работни дни и работно време на служителя
- Статуси: чакаща, потвърдена, отказана, завършена
- Бележка от клиента, резервации „на място“ (walk-in) от админа
- Изборът се пази в URL – ако клиентът не е влязъл, след вход/регистрация се връща точно там

**Табло (Dashboard)**
- Статистика: предстоящи, приходи (общо и този месец), очаквани приходи, клиенти
- Следващи 5 часа
- Списък с търсене (debounce), филтър по статус и период, пагинация
- Създаване/редакция в модален прозорец, изтриване и отказ с „Сигурен ли си?“

**Управление (само admin)**
- CRUD за услуги: търсене, филтър по категория, сортиране, активна/неактивна, AI описание
- CRUD за служители: работни дни, работно време, кои услуги предлага, акаунт за вход

**UX и надеждност**
- **Health gate** – при стартиране фронтендът проверява `GET /api/health` и показва блокиращ екран „сървърът зарежда...“, докато сървърът и базата не са готови (проверка на 2 сек., след 60 сек. бутон „Опитай отново“)
- **Без toast-ове и alert()** – всички съобщения са inline (зелени/червени кутии) и идват директно от сървъра
- Грешките по полета се показват под всяко поле
- **Нула native `<select>`** – собствен `CustomDropdown` с търсене, клавиатура (↑ ↓ Enter Esc), clear бутон, disabled/error състояния
- Skeleton loaders, EmptyState, ErrorBoundary, 404 страница, 403 екран
- Офлайн банер, глобална обработка на 401 (автоматичен изход + пренасочване), 403, 404, 500, мрежови грешки
- Responsive дизайн, мобилно меню, footer, favicon

**Сигурност (backend)**
- JWT (7 дни) в `Authorization: Bearer` + httpOnly cookie, bcryptjs (12 rounds)
- helmet, cors (allowlist от `CLIENT_URL`), express-rate-limit (общ, за вход, за AI)
- Валидация на всички входни данни с конкретни съобщения по поле
- Централизиран error handler: Mongoose ValidationError, CastError, duplicate key 11000, DocumentNotFound, JWT грешки, невалиден JSON, твърде голяма заявка, CORS, rate limit, 404 за API, `uncaughtException` и `unhandledRejection`
- Еднакъв формат на отговорите: `{ success, message, data, meta? }` и `{ success: false, message, errors: [] }`

---

## Технологии

| Част | Технологии |
|------|------------|
| Frontend | React 18, Vite 5, **TypeScript (strict)**, React Router DOM v6, Axios, Tailwind CSS 3 – тъмна тема в синьо и червено (barber стил) |
| Backend | Node.js (18+), Express 4, MongoDB + Mongoose 8, JWT, bcryptjs, cors, helmet, express-rate-limit, dotenv, cookie-parser |
| AI | OpenAI Chat Completions API през `fetch` (модел `gpt-4o-mini`) + локален mock AI |

---

## Изисквания

- **Node.js 18 или по-нов** (https://nodejs.org)
- **MongoDB** – безплатен клъстер в **MongoDB Atlas** (https://www.mongodb.com/atlas) или локален MongoDB

---

## Как да си сложиш твоите данни

В проекта вече има **готови `.env` файлове с празни стойности**. Попълваш само своите данни – нищо не е измислено от нас.

### Стъпка 1 – Backend: отвори `AI-Booking-Template-1/backend/.env`

```env
# Порт на сървъра, ако го оставиш празен ще е 5000
PORT=
# Твоят MongoDB Atlas URI - сложи го тук
MONGO_URI=
# Твоят секретен ключ за JWT - измисли си дълъг произволен текст и го сложи тук
JWT_SECRET=
# Колко време да е валиден токена, пример: 7d
JWT_EXPIRE=
# Адрес на фронтенда, пример: http://localhost:5173
CLIENT_URL=
# Твоят OpenAI API ключ - ако нямаш, остави празно, AI-то ще работи с mock
OPENAI_API_KEY=
```

1. **MONGO_URI** – влез в MongoDB Atlas → създай безплатен клъстер → *Database Access* → създай потребител с парола → *Network Access* → добави своя IP (или `0.0.0.0/0` за тест) → *Connect* → *Drivers* → копирай адреса. Замени `<password>` с паролата и добави име на базата след `/`, например:
   `mongodb+srv://ime:parola@cluster0.xxxxx.mongodb.net/ai-booking?retryWrites=true&w=majority`
2. **JWT_SECRET** – напиши дълъг произволен текст (поне 32 символа). Можеш да генерираш такъв с:
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
3. **JWT_EXPIRE** – например `7d` (7 дни). Ако е празно – 7 дни.
4. **CLIENT_URL** – адресът на фронтенда. Локално: `http://localhost:5173`. Може няколко, разделени със запетая.
5. **OPENAI_API_KEY** – ключ от https://platform.openai.com/api-keys. **Ако нямаш – остави празно**, AI-то работи с вградения mock.
6. **PORT** – по желание, по подразбиране `5000`.

### Стъпка 2 – Frontend: отвори `AI-Booking-Template-1/frontend/.env`

```env
# Адрес на бекенда, пример: http://localhost:5000/api - сложи твоя тук
VITE_API_URL=
```

- Локално можеш да го **оставиш празно** – Vite автоматично пренасочва `/api` към `http://localhost:5000`.
- Ако бекендът е на друг порт или в интернет (напр. Render), сложи пълния адрес, например `https://moyat-backend.onrender.com/api`.
- След промяна на `.env` във фронтенда рестартирай `npm run dev`.

### Какво става, ако оставиш нещо празно

| Променлива | Ако е празна |
|-----------|--------------|
| `PORT` | използва се `5000` |
| `MONGO_URI` | опитва локален MongoDB `mongodb://127.0.0.1:27017/ai-booking-template-1`; ако няма – сървърът работи, но health връща 503 и фронтендът чака |
| `JWT_SECRET` | генерира се временен ключ (при рестарт всички трябва да влязат отново) – **за продукция задължително го попълни** |
| `JWT_EXPIRE` | `7d` |
| `CLIENT_URL` | `http://localhost:5173` |
| `OPENAI_API_KEY` | AI работи с локалния mock |
| `VITE_API_URL` | `/api` през Vite proxy |

> `.env` файловете са в `.gitignore` – тайните ти няма да отидат в GitHub. `.env.example` файловете остават като шаблон.

---

## Инсталация и стартиране

### Стартиране

**1. Backend**
```bash
cd AI-Booking-Template-1/backend
npm install
# попълни backend/.env (виж горе)
npm run seed     # демо данни (по желание, но препоръчително)
npm run dev      # http://localhost:5000
```

**2. Frontend** (в нов терминал)
```bash
cd AI-Booking-Template-1/frontend
npm install
npm run dev      # http://localhost:5173
```

Отвори **http://localhost:5173**. Първо ще видиш екрана „сървърът зарежда...“, докато бекендът и базата не са готови – след това приложението се отваря автоматично.

### Production build
```bash
cd frontend && npm run build     # проверка на типовете (tsc) + build в frontend/dist
cd backend && npm start
```
За продукция задай `NODE_ENV=production` на сървъра (cookie-тата стават `secure` + `sameSite=none`).

---

## Seed (демо данни)

```bash
cd backend
npm run seed
```

⚠️ Seed-ът **изтрива** всички потребители, услуги и резервации и създава наново:
- 1 администратор, 1 демо клиент
- 3 служители (Георги – барбър, Мария – стилист, Елена – маникюрист) с работно време
- 6 демо услуги (подстригване, брада, комбо, дамско подстригване, боядисване, маникюр)
- 5 демо резервации (чакаща, потвърдени, завършена, отказана)

## Данни за вход

| Роля | Имейл | Парола |
|------|-------|--------|
| **Администратор** | **admin@test.com** | **123456** |
| Клиент | client@test.com | 123456 |
| Служител | georgi@test.com / maria@test.com / elena@test.com | 123456 |

> Смени паролите преди да пуснеш сайта за реални клиенти.

---

## API (накратко)

| Метод | Път | Достъп | Описание |
|-------|-----|--------|----------|
| GET | `/api/health` | публичен | Проверка на сървъра и базата (200 / 503) |
| POST | `/api/auth/register` | публичен | Регистрация (клиент) |
| POST | `/api/auth/login` | публичен | Вход |
| POST | `/api/auth/logout` | публичен | Изход |
| GET/PUT | `/api/auth/me` | влязъл | Профил |
| GET | `/api/services` | публичен | Списък: `page, limit, search, category, sort` |
| GET | `/api/services/categories` | публичен | Категории |
| GET | `/api/services/:id` | публичен | Една услуга |
| POST/PUT/DELETE | `/api/services/:id?` | admin | CRUD услуги |
| GET | `/api/staff` | публичен | Служители (`serviceId` филтър) |
| POST/PUT/DELETE | `/api/staff/:id?` | admin | CRUD служители |
| GET | `/api/bookings/availability` | публичен | Свободни часове: `serviceId, staffId, date` |
| GET | `/api/bookings` | влязъл | Резервации (според ролята): `search, status, scope, page` |
| GET | `/api/bookings/stats` | admin, staff | Статистика за таблото |
| POST | `/api/bookings` | влязъл | Нова резервация |
| PATCH | `/api/bookings/:id/status` | влязъл | Смяна на статус |
| PUT/DELETE | `/api/bookings/:id` | admin | Редакция / изтриване |
| POST | `/api/ai/generate-description` | admin | AI описание на услуга |
| POST | `/api/ai/chat` | публичен | AI асистент за резервации |

---

## Структура на папките

```
AI-Booking-Template-1/
├── backend/
│   ├── src/
│   │   ├── config/db.js
│   │   ├── models/            User.js, Service.js, Booking.js, AIChatMessage.js
│   │   ├── routes/            auth, services, staff, bookings, ai, health (*.routes.js)
│   │   ├── controllers/       auth, services, staff, bookings, ai (*.controller.js)
│   │   ├── middlewares/       auth, error, validate, rateLimit, requireDb (*.middleware.js)
│   │   ├── utils/             asyncHandler, ApiError, ApiResponse, availability, jwt, openai, pagination, time
│   │   ├── server.js
│   │   └── seed.js
│   ├── package.json
│   ├── .env
│   └── .env.example
├── frontend/
│   ├── public/favicon.svg               (бръснарски стълб)
│   ├── src/
│   │   ├── api/axios.ts
│   │   ├── components/        CustomDropdown, InlineFeedback, LoadingScreen, Navbar, Footer, ProtectedRoute,
│   │   │                      ErrorBoundary, ConfirmModal, EmptyState, AIChatWidget, Modal, Pagination, Skeleton,
│   │   │                      ServiceCard, Calendar, PasswordInput, BarberPole, SafeImage, PageHeader, AuthLayout (*.tsx)
│   │   ├── context/AuthContext.tsx
│   │   ├── hooks/useDebounce.ts
│   │   ├── pages/             Home, Services, BookingPage, Login, Register, Dashboard, AdminServices, NotFound (*.tsx)
│   │   ├── types/index.ts     (всички типове: User, Service, Booking, Stats...)
│   │   ├── utils/format.ts, utils/images.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env
│   └── .env.example
├── README.md
└── .gitignore
```

---

## Персонализиране за твоя бизнес

- **Име и лого:** `frontend/src/components/Navbar.tsx` (компонент `Logo`) и `frontend/public/favicon.svg`
- **Цветове:** `frontend/tailwind.config.js` → `brand` (синьо), `accent` (червено), `ink` (тъмни фонове)
- **Снимки:** `frontend/src/utils/images.ts` – смени URL-ите със снимки на твоя салон. Ако снимка не се зареди, автоматично се показват бръснарски ивици.
- **Текстове на началната страница:** `frontend/src/pages/Home.tsx`
- **Валута:** `CURRENCY` в `frontend/src/utils/format.ts` и `backend/src/utils/time.js` (по подразбиране EUR)
- **Стъпка на часовете (30 мин):** `SLOT_STEP_MINUTES` в `backend/src/utils/time.js`
- **AI модел:** `OPENAI_MODEL` в `backend/src/utils/openai.js`

---

## Чести проблеми

| Проблем | Решение |
|---------|---------|
| Вечно „сървърът зарежда...“ | Бекендът не е стартиран или `MONGO_URI` е грешен. Виж конзолата на бекенда. В Atlas провери *Network Access*. |
| „CORS: достъпът от адрес ... не е разрешен“ | Добави адреса на фронтенда в `CLIENT_URL` в `backend/.env` и рестартирай бекенда. |
| „Порт 5000 е зает“ | Смени `PORT` в `backend/.env` и `VITE_API_URL` във `frontend/.env`. |
| Излиза ме при всяко рестартиране | Попълни `JWT_SECRET`. |
| AI отговаря „по-простичко“ | Работи mock режимът – добави `OPENAI_API_KEY`. |

---

© AI-Booking-Template-1. Шаблон за продажба и повторна употреба.
