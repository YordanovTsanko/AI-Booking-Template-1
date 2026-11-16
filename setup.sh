#!/usr/bin/env bash
# =====================================================================
#  AI-Booking-Template-1 – one-click setup (Mac / Linux)
#  Creates the full folder structure with ALL files and installs deps.
#  Existing .env files are NEVER overwritten.
#  Usage:  bash setup.sh
# =====================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "$(basename "$SCRIPT_DIR")" = "AI-Booking-Template-1" ]; then
  TARGET="$SCRIPT_DIR"
else
  TARGET="$SCRIPT_DIR/AI-Booking-Template-1"
fi

echo ""
echo "=============================================="
echo "  AI-Booking-Template-1 – инсталация"
echo "=============================================="
echo "Папка: $TARGET"
echo ""

write_file() {
  # $1 = relative path; content comes from stdin
  local path="$TARGET/$1"
  mkdir -p "$(dirname "$path")"
  case "$1" in
    */.env|.env)
      if [ -f "$path" ]; then
        echo "  • пропускам $1 (вече съществува – твоите данни са запазени)"
        cat > /dev/null
        return
      fi
      ;;
  esac
  cat > "$path"
  echo "  ✓ $1"
}

echo "Създавам файловете..."

write_file '.gitignore' <<'AIBT_FILE_END_7f3a'
# Dependencies
node_modules/
**/node_modules/

# Builds
dist/
build/
**/dist/

# Environment files with real secrets (.env.example stays in git!)
.env
**/.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# OS / editor
.DS_Store
Thumbs.db
desktop.ini
.idea/
.vscode/*
!.vscode/extensions.json
*.swp
*.swo

# Misc
coverage/
.cache/
.vite/
*.tgz
AIBT_FILE_END_7f3a

write_file 'README.md' <<'AIBT_FILE_END_7f3a'
# AI-Booking-Template-1

**Пълна AI система за онлайн резервации за бизнеси с услуги** – бръснарници, фризьорски салони, автомивки, студиа за красота, фото студиа.
Готов шаблон за продажба и повторна употреба (MERN stack, без TypeScript).

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
| Frontend | React 18, Vite 5, JavaScript, React Router DOM v6, Axios, Tailwind CSS 3 |
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

### Вариант А – с един клик
- **Windows:** двоен клик на `setup.bat`
- **Mac / Linux:** `bash setup.sh`

Скриптовете създават/възстановяват цялата структура `AI-Booking-Template-1/frontend` и `AI-Booking-Template-1/backend` с всички файлове и (ако има Node.js) инсталират зависимостите. Попълнените ти `.env` файлове **никога не се презаписват**.

### Вариант Б – ръчно

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
cd frontend && npm run build     # резултатът е в frontend/dist
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
│   ├── public/favicon.svg
│   ├── src/
│   │   ├── api/axios.js
│   │   ├── components/        CustomDropdown, InlineFeedback, LoadingScreen, Navbar, Footer, ProtectedRoute,
│   │   │                      ErrorBoundary, ConfirmModal, EmptyState, AIChatWidget, Modal, Pagination,
│   │   │                      Skeleton, ServiceCard, Calendar, PasswordInput (*.jsx)
│   │   ├── context/AuthContext.jsx
│   │   ├── hooks/useDebounce.js
│   │   ├── pages/             Home, Services, BookingPage, Login, Register, Dashboard, AdminServices, NotFound (*.jsx)
│   │   ├── utils/format.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env
│   └── .env.example
├── README.md
├── .gitignore
├── setup.bat
└── setup.sh
```

---

## Персонализиране за твоя бизнес

- **Име и лого:** `frontend/src/components/Navbar.jsx` (компонент `Logo`) и `frontend/public/favicon.svg`
- **Цветове:** `frontend/tailwind.config.js` → `brand`
- **Текстове на началната страница:** `frontend/src/pages/Home.jsx`
- **Валута:** `CURRENCY` в `frontend/src/utils/format.js` и `backend/src/utils/time.js` (по подразбиране EUR)
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
AIBT_FILE_END_7f3a

write_file 'backend/.env' <<'AIBT_FILE_END_7f3a'
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
AIBT_FILE_END_7f3a

write_file 'backend/.env.example' <<'AIBT_FILE_END_7f3a'
# ============================================================
#  AI-Booking-Template-1 – настройки на бекенда (пример)
#  Копирай този файл като .env и попълни СВОИТЕ стойности.
#  Празна стойност = приложението използва безопасен fallback.
# ============================================================

# Порт на сървъра, ако го оставиш празен ще е 5000
PORT=

# Твоят MongoDB Atlas URI - сложи го тук
# Взима се от MongoDB Atlas -> Connect -> Drivers.
# Ако е празно, сървърът опитва локален MongoDB (mongodb://127.0.0.1:27017/ai-booking-template-1)
MONGO_URI=

# Твоят секретен ключ за JWT - измисли си дълъг произволен текст и го сложи тук
# Ако е празно, при всяко рестартиране се генерира временен ключ и всички трябва да влязат отново.
JWT_SECRET=

# Колко време да е валиден токена, пример: 7d
# Ако е празно, се използва 7d
JWT_EXPIRE=

# Адрес на фронтенда, пример: http://localhost:5173
# Може няколко адреса, разделени със запетая. Ако е празно – http://localhost:5173
CLIENT_URL=

# Твоят OpenAI API ключ - ако нямаш, остави празно, AI-то ще работи с mock
OPENAI_API_KEY=
AIBT_FILE_END_7f3a

write_file 'backend/package.json' <<'AIBT_FILE_END_7f3a'
{
  "name": "ai-booking-template-1-backend",
  "version": "1.0.0",
  "description": "AI-Booking-Template-1 – REST API for an AI-powered booking system for service businesses",
  "main": "src/server.js",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node src/seed.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "express-rate-limit": "^7.4.1",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.8.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.7"
  },
  "nodemonConfig": {
    "watch": ["src", ".env"],
    "ext": "js,json,env"
  }
}
AIBT_FILE_END_7f3a

write_file 'backend/src/seed.js' <<'AIBT_FILE_END_7f3a'
/**
 * Seed script: npm run seed
 * Creates: 1 admin, 3 staff, 1 demo client, 6 services, 5 bookings.
 * WARNING: wipes Users, Services, Bookings and AI chat messages first.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Service from './models/Service.js';
import Booking from './models/Booking.js';
import AIChatMessage from './models/AIChatMessage.js';
import { todayStr, addDays, dayOfWeek, toMinutes, toHHMM, combineDateTime } from './utils/time.js';

const SERVICES = [
  {
    title: 'Мъжко подстригване',
    category: 'Подстригване',
    price: 15,
    duration: 30,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
    description:
      'Класическо или модерно мъжко подстригване, съобразено с формата на лицето и стила ти. Включва измиване, подстригване и стайлинг с професионални продукти.',
  },
  {
    title: 'Оформяне на брада',
    category: 'Брада',
    price: 10,
    duration: 30,
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&q=80',
    description:
      'Прецизно оформяне на контура с бръснач, изравняване на дължината, горещ компрес и подхранващо масло за мека и поддържана брада.',
  },
  {
    title: 'Подстригване + брада',
    category: 'Подстригване',
    price: 22,
    duration: 60,
    image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&q=80',
    description:
      'Пълен пакет за мъже – подстригване и оформяне на брада в едно посещение. Излизаш с напълно обновена визия за по-изгодна цена.',
  },
  {
    title: 'Дамско подстригване и сешоар',
    category: 'Коса',
    price: 28,
    duration: 60,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
    description:
      'Подстригване по твой вкус, последвано от професионално оформяне със сешоар. Включва измиване с подходящ за косата ти шампоан и балсам.',
  },
  {
    title: 'Боядисване на коса',
    category: 'Коса',
    price: 45,
    duration: 120,
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80',
    description:
      'Боядисване с щадящи професионални бои и индивидуално подбран нюанс. Процедурата завършва с подхранваща грижа за блестяща и здрава коса.',
  },
  {
    title: 'Класически маникюр',
    category: 'Маникюр',
    price: 18,
    duration: 45,
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80',
    description:
      'Почистване, оформяне и подхранване на ноктите и кожичките, завършено с лак по избор. Перфектни ръце за всеки ден.',
  },
];

const nextWorkingDate = (fromOffset, workingDays) => {
  let date = addDays(todayStr(), fromOffset);
  for (let i = 0; i < 14 && !workingDays.includes(dayOfWeek(date)); i += 1) date = addDays(date, 1);
  return date;
};

const previousWorkingDate = (workingDays) => {
  let date = addDays(todayStr(), -1);
  for (let i = 0; i < 14 && !workingDays.includes(dayOfWeek(date)); i += 1) date = addDays(date, -1);
  return date;
};

const makeBooking = ({ client, service, staff, date, time, status, notes = '' }) => ({
  client: client?._id || null,
  clientName: client?.name || 'Клиент на място',
  clientEmail: client?.email || '',
  clientPhone: client?.phone || '',
  service: service._id,
  serviceTitle: service.title,
  staff: staff._id,
  staffName: staff.name,
  date,
  time,
  endTime: toHHMM(toMinutes(time) + service.duration),
  startAt: combineDateTime(date, time),
  duration: service.duration,
  price: service.price,
  status,
  notes,
  active: status !== 'cancelled',
});

const seed = async () => {
  const connected = await connectDB({ retry: false });
  if (!connected) {
    console.error('❌ Seed aborted – could not connect to MongoDB. Check MONGO_URI in backend/.env');
    process.exit(1);
  }

  console.log('🧹 Clearing collections...');
  await Promise.all([User.deleteMany({}), Service.deleteMany({}), Booking.deleteMany({}), AIChatMessage.deleteMany({})]);
  await Promise.all([User.syncIndexes(), Service.syncIndexes(), Booking.syncIndexes(), AIChatMessage.syncIndexes()]);

  console.log('👤 Creating admin & demo client...');
  const admin = await User.create({ name: 'Администратор', email: 'admin@test.com', password: '123456', role: 'admin', phone: '+359 888 000 000' });
  const client = await User.create({ name: 'Иван Клиентов', email: 'client@test.com', password: '123456', role: 'client', phone: '+359 888 111 222' });

  console.log('✂️  Creating services...');
  const services = await Service.insertMany(SERVICES);
  const byTitle = Object.fromEntries(services.map((s) => [s.title, s]));

  console.log('🧑‍🔧 Creating staff...');
  const weekdays = [1, 2, 3, 4, 5];
  const georgi = await User.create({
    name: 'Георги Петров',
    email: 'georgi@test.com',
    password: '123456',
    role: 'staff',
    phone: '+359 888 333 444',
    position: 'Старши барбър',
    bio: '10 години опит в класическото и модерното мъжко подстригване.',
    services: [byTitle['Мъжко подстригване']._id, byTitle['Оформяне на брада']._id, byTitle['Подстригване + брада']._id],
    workingDays: [1, 2, 3, 4, 5, 6],
    workStart: '09:00',
    workEnd: '18:00',
  });
  const maria = await User.create({
    name: 'Мария Иванова',
    email: 'maria@test.com',
    password: '123456',
    role: 'staff',
    phone: '+359 888 555 666',
    position: 'Фризьор-стилист',
    bio: 'Специалист по дамски прически, цвят и балеаж.',
    services: [byTitle['Дамско подстригване и сешоар']._id, byTitle['Боядисване на коса']._id, byTitle['Мъжко подстригване']._id],
    workingDays: weekdays,
    workStart: '10:00',
    workEnd: '19:00',
  });
  const elena = await User.create({
    name: 'Елена Димитрова',
    email: 'elena@test.com',
    password: '123456',
    role: 'staff',
    phone: '+359 888 777 888',
    position: 'Маникюрист',
    bio: 'Маникюр, педикюр и грижа за ръцете с внимание към детайла.',
    services: [byTitle['Класически маникюр']._id],
    workingDays: [2, 3, 4, 5, 6],
    workStart: '09:00',
    workEnd: '17:00',
  });

  console.log('📅 Creating bookings...');
  const bookings = [
    makeBooking({ client, service: byTitle['Мъжко подстригване'], staff: georgi, date: nextWorkingDate(1, georgi.workingDays), time: '10:00', status: 'confirmed', notes: 'Късо отстрани, по-дълго отгоре.' }),
    makeBooking({ client, service: byTitle['Класически маникюр'], staff: elena, date: nextWorkingDate(2, elena.workingDays), time: '11:00', status: 'pending' }),
    makeBooking({ client: null, service: byTitle['Боядисване на коса'], staff: maria, date: nextWorkingDate(3, maria.workingDays), time: '13:00', status: 'confirmed', notes: 'Клиентка по телефона – Петя, тел. 0899 123 456' }),
    makeBooking({ client, service: byTitle['Подстригване + брада'], staff: georgi, date: previousWorkingDate(georgi.workingDays), time: '15:00', status: 'completed' }),
    makeBooking({ client, service: byTitle['Дамско подстригване и сешоар'], staff: maria, date: nextWorkingDate(4, maria.workingDays), time: '16:00', status: 'cancelled', notes: 'Отказано от клиента.' }),
  ];
  await Booking.insertMany(bookings);

  console.log('\n✅ Seed completed!');
  console.log('----------------------------------------------');
  console.log(`Admin:  ${admin.email} / 123456`);
  console.log(`Client: ${client.email} / 123456`);
  console.log('Staff:  georgi@test.com, maria@test.com, elena@test.com / 123456');
  console.log(`Services: ${services.length}, Staff: 3, Bookings: ${bookings.length}`);
  console.log('----------------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
AIBT_FILE_END_7f3a

write_file 'backend/src/server.js' <<'AIBT_FILE_END_7f3a'
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectDB, disconnectDB } from './config/db.js';
import ApiError from './utils/ApiError.js';
import ApiResponse from './utils/ApiResponse.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';
import requireDb from './middlewares/requireDb.middleware.js';
import { apiNotFound, notFound, errorHandler } from './middlewares/error.middleware.js';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import servicesRoutes from './routes/services.routes.js';
import staffRoutes from './routes/staff.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import aiRoutes from './routes/ai.routes.js';

// ---------- Crash handlers (registered first) ----------
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION – shutting down...', err);
  process.exit(1);
});

const PORT = Number(process.env.PORT) || 5000;
const DEFAULT_CLIENT_URL = 'http://localhost:5173';

const allowedOrigins = ((process.env.CLIENT_URL || '').trim() || DEFAULT_CLIENT_URL)
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// ---------- Security & parsing ----------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server tools (curl, Postman) without an Origin header
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
      return callback(
        ApiError.forbidden(`CORS: достъпът от адрес ${origin} не е разрешен. Добави го в CLIENT_URL в backend/.env.`)
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// ---------- Routes ----------
// Health is lightweight, not rate-limited and works even when the DB is down.
app.use('/api/health', healthRoutes);

app.use('/api', apiLimiter);
app.use('/api', requireDb);

app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (_req, res) =>
  ApiResponse.ok(res, 'AI-Booking-Template-1 API работи. Използвай /api/health за проверка.', {
    name: 'AI-Booking-Template-1',
    version: '1.0.0',
  })
);

// ---------- 404 + errors ----------
app.use('/api', apiNotFound);
app.use(notFound);
app.use(errorHandler);

// ---------- Start ----------
const server = app.listen(PORT, () => {
  console.log('==============================================');
  console.log(`🚀 AI-Booking-Template-1 API is ready on http://localhost:${PORT}`);
  console.log(`❤️  Health check:  http://localhost:${PORT}/api/health`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`🤖 AI mode: ${(process.env.OPENAI_API_KEY || '').trim() ? 'OpenAI' : 'mock (no OPENAI_API_KEY)'}`);
  console.log('==============================================');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Change PORT in backend/.env or stop the other process.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

connectDB();

// ---------- Graceful shutdown ----------
const shutdown = (signal, code = 0) => {
  console.log(`\n👋 ${signal} received – closing server...`);
  server.close(async () => {
    await disconnectDB();
    process.exit(code);
  });
  setTimeout(() => process.exit(code), 10000).unref();
};

process.on('unhandledRejection', (reason) => {
  console.error('💥 UNHANDLED REJECTION – shutting down...', reason);
  shutdown('unhandledRejection', 1);
});
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
AIBT_FILE_END_7f3a

write_file 'backend/src/config/db.js' <<'AIBT_FILE_END_7f3a'
import mongoose from 'mongoose';

// Used only when MONGO_URI is empty – a local MongoDB, not a secret.
export const DEFAULT_MONGO_URI = 'mongodb://127.0.0.1:27017/ai-booking-template-1';
const RETRY_DELAY_MS = 5000;

let retryTimer = null;
let listenersAttached = false;

export const getMongoUri = () => (process.env.MONGO_URI || '').trim() || DEFAULT_MONGO_URI;

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const getDbStatus = () => (isDbConnected() ? 'connected' : 'disconnected');

const attachListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;
  mongoose.connection.on('disconnected', () => console.warn('⚠️  MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => console.log('✅ MongoDB reconnected'));
  mongoose.connection.on('error', (err) => console.error(`❌ MongoDB error: ${err.message}`));
};

/**
 * Connects to MongoDB. Never throws – on failure it schedules a retry
 * so the HTTP server stays alive and /api/health reports "disconnected".
 * @param {{ retry?: boolean }} options
 * @returns {Promise<boolean>}
 */
export const connectDB = async ({ retry = true } = {}) => {
  attachListeners();
  mongoose.set('strictQuery', true);

  if (!(process.env.MONGO_URI || '').trim()) {
    console.warn(`⚠️  MONGO_URI is empty – trying local MongoDB at ${DEFAULT_MONGO_URI}`);
  }

  try {
    await mongoose.connect(getMongoUri(), { serverSelectionTimeoutMS: 8000 });
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return true;
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    if (retry) {
      console.log(`🔁 Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s...`);
      clearTimeout(retryTimer);
      retryTimer = setTimeout(() => connectDB({ retry: true }), RETRY_DELAY_MS);
    }
    return false;
  }
};

export const disconnectDB = async () => {
  clearTimeout(retryTimer);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore – shutting down anyway
  }
};
AIBT_FILE_END_7f3a

write_file 'backend/src/controllers/ai.controller.js' <<'AIBT_FILE_END_7f3a'
import Service from '../models/Service.js';
import User from '../models/User.js';
import AIChatMessage from '../models/AIChatMessage.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { hasOpenAI, callOpenAI } from '../utils/openai.js';
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

  if (hasOpenAI()) {
    try {
      description = await callOpenAI({
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
      source = 'openai';
    } catch (err) {
      console.warn(`⚠️  OpenAI description failed, using mock: ${err.message}`);
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

const parseIntentOpenAI = async (message, history, services) => {
  const today = todayStr();
  const serviceList = services.map((s) => ({ id: String(s._id), title: s.title, category: s.category, price: s.price, duration: s.duration }));

  const result = await callOpenAI({
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
  if (hasOpenAI()) {
    try {
      intent = await parseIntentOpenAI(message, history, services);
      source = 'openai';
    } catch (err) {
      console.warn(`⚠️  OpenAI chat failed, using mock: ${err.message}`);
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
AIBT_FILE_END_7f3a

write_file 'backend/src/controllers/auth.controller.js' <<'AIBT_FILE_END_7f3a'
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken, getCookieOptions } from '../utils/jwt.js';

const sendAuth = (res, statusCode, message, user) => {
  const token = signToken(user);
  res.cookie('token', token, getCookieOptions());
  return ApiResponse.send(res, statusCode, message, { user: user.toJSON(), token });
};

const firstName = (name = '') => String(name).trim().split(/\s+/)[0];

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name).trim();
  const email = String(req.body.email).trim().toLowerCase();
  const phone = req.body.phone ? String(req.body.phone).trim() : '';

  const exists = await User.exists({ email });
  if (exists) {
    throw ApiError.conflict('Този имейл вече е зает', [
      { field: 'email', message: 'Този имейл вече е зает. Пробвай да влезеш или използвай друг.' },
    ]);
  }

  // Public registration always creates a client – roles are never taken from the body.
  const user = await User.create({ name, email, phone, password: req.body.password, role: 'client' });

  return sendAuth(res, 201, `Успешна регистрация, добре дошъл, ${firstName(user.name)}!`, user);
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Не намерихме профил с този имейл.', [
      { field: 'email', message: 'Няма регистриран профил с този имейл' },
    ]);
  }

  const isMatch = await user.comparePassword(req.body.password);
  if (!isMatch) {
    throw ApiError.unauthorized('Грешна парола, опитай отново', [
      { field: 'password', message: 'Грешна парола, опитай отново' },
    ]);
  }

  if (!user.isActive) throw ApiError.forbidden('Профилът ти е деактивиран. Свържи се с администратор.');

  return sendAuth(res, 200, `Здравей отново, ${firstName(user.name)}! Радваме се да те видим.`, user);
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (_req, res) => {
  const { maxAge, ...options } = getCookieOptions();
  res.clearCookie('token', options);
  return ApiResponse.ok(res, 'Излезе успешно. Ще се видим скоро!');
});

/** GET /api/auth/me */
export const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, 'Профилът е зареден.', { user: req.user.toJSON() });
});

/** PUT /api/auth/me – update own name / phone */
export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name !== undefined) req.user.name = String(name).trim();
  if (phone !== undefined) req.user.phone = String(phone).trim();
  await req.user.save();
  return ApiResponse.ok(res, 'Профилът ти е обновен.', { user: req.user.toJSON() });
});
AIBT_FILE_END_7f3a

write_file 'backend/src/controllers/bookings.controller.js' <<'AIBT_FILE_END_7f3a'
import mongoose from 'mongoose';
import Booking, { ACTIVE_STATUSES } from '../models/Booking.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { getPagination, buildPaginationMeta, escapeRegex } from '../utils/pagination.js';
import { computeAvailableSlots, assertSlotAvailable, staffOffersService } from '../utils/availability.js';
import { combineDateTime, toMinutes, toHHMM, formatDateBg, dayOfWeek, todayStr } from '../utils/time.js';

const POPULATE = [
  { path: 'service', select: 'title price duration category image' },
  { path: 'staff', select: 'name position' },
  { path: 'client', select: 'name email phone' },
];

const STATUS_MESSAGES = {
  confirmed: 'Резервацията е потвърдена. Клиентът ще бъде доволен!',
  completed: 'Резервацията е отбелязана като завършена. Браво!',
  cancelled: 'Резервацията е отказана.',
  pending: 'Резервацията е върната в статус „Чакаща“.',
};

// Allowed transitions for staff/admin
const TRANSITIONS = {
  pending: ['confirmed', 'cancelled', 'completed'],
  confirmed: ['completed', 'cancelled', 'pending'],
  cancelled: ['pending', 'confirmed'], // admin only (re-open)
  completed: ['confirmed'], // admin only (undo)
};

const loadService = async (serviceId) => {
  const service = await Service.findById(serviceId);
  if (!service || !service.isActive) {
    throw ApiError.notFound('Тази услуга вече не е налична.', [{ field: 'serviceId', message: 'Услугата не е налична' }]);
  }
  return service;
};

const loadStaff = async (staffId) => {
  const staff = await User.findOne({ _id: staffId, role: 'staff', isActive: true });
  if (!staff) {
    throw ApiError.notFound('Избраният служител не е наличен.', [{ field: 'staffId', message: 'Служителят не е наличен' }]);
  }
  return staff;
};

const assertStaffOffers = (staff, service) => {
  if (!staffOffersService(staff, service._id)) {
    throw ApiError.badRequest(`${staff.name} не предлага услугата „${service.title}“.`, [
      { field: 'staffId', message: 'Този служител не предлага избраната услуга' },
    ]);
  }
};

const assertFuture = (date, time) => {
  if (combineDateTime(date, time) <= new Date()) {
    throw ApiError.badRequest('Датата и часът трябва да са в бъдещето.', [
      { field: 'date', message: 'Избери бъдеща дата и час' },
    ]);
  }
};

const canAccess = (user, booking) => {
  if (user.role === 'admin') return true;
  if (user.role === 'staff') return String(booking.staff?._id || booking.staff) === String(user._id);
  return booking.client && String(booking.client?._id || booking.client) === String(user._id);
};

/** GET /api/bookings/availability?serviceId&staffId&date[&excludeId] – public */
export const getAvailability = asyncHandler(async (req, res) => {
  const { serviceId, staffId, date, excludeId } = req.query;
  const [service, staff] = await Promise.all([loadService(serviceId), loadStaff(staffId)]);
  assertStaffOffers(staff, service);

  const isWorkingDay = staff.workingDays.includes(dayOfWeek(date));
  const slots = date < todayStr() ? [] : await computeAvailableSlots({ staff, duration: service.duration, date, excludeBookingId: excludeId || null });

  let message;
  if (date < todayStr()) message = 'Тази дата вече е минала. Избери бъдеща дата.';
  else if (!isWorkingDay) message = `${staff.name} не работи в този ден. Избери друга дата.`;
  else if (!slots.length) message = 'За тази дата няма свободни часове. Пробвай друг ден.';
  else message = `Намерихме ${slots.length} свободни ${slots.length === 1 ? 'час' : 'часа'}.`;

  return ApiResponse.ok(res, message, {
    date,
    isWorkingDay,
    slots,
    workStart: staff.workStart,
    workEnd: staff.workEnd,
    duration: service.duration,
    staff: { _id: staff._id, name: staff.name },
  });
});

/** POST /api/bookings – any logged-in user */
export const createBooking = asyncHandler(async (req, res) => {
  const { serviceId, staffId, date, time, notes } = req.body;
  const [service, staff] = await Promise.all([loadService(serviceId), loadStaff(staffId)]);
  assertStaffOffers(staff, service);
  assertFuture(date, time);
  await assertSlotAvailable({ staff, date, time, duration: service.duration });

  const isManager = ['admin', 'staff'].includes(req.user.role);
  const isWalkIn = isManager && req.body.clientName && String(req.body.clientName).trim();

  const clientData = isWalkIn
    ? {
        client: null,
        clientName: String(req.body.clientName).trim(),
        clientEmail: req.body.clientEmail ? String(req.body.clientEmail).trim() : '',
        clientPhone: req.body.clientPhone ? String(req.body.clientPhone).trim() : '',
      }
    : {
        client: req.user._id,
        clientName: req.user.name,
        clientEmail: req.user.email,
        clientPhone: req.user.phone || '',
      };

  const booking = await Booking.create({
    ...clientData,
    service: service._id,
    serviceTitle: service.title,
    staff: staff._id,
    staffName: staff.name,
    date,
    time,
    endTime: toHHMM(toMinutes(time) + service.duration),
    startAt: combineDateTime(date, time),
    duration: service.duration,
    price: service.price,
    status: isManager && req.body.status === 'confirmed' ? 'confirmed' : 'pending',
    notes: notes ? String(notes).trim() : '',
    createdBy: req.user._id,
  });

  await booking.populate(POPULATE);

  const message = isWalkIn
    ? `Готово! Резервацията за ${booking.clientName} е създадена за ${formatDateBg(date)} в ${time}.`
    : `Готово! Резервацията ти е запазена за ${formatDateBg(date)} в ${time} при ${staff.name}.`;

  return ApiResponse.created(res, message, booking);
});

/** GET /api/bookings – role-scoped list with search, filters & pagination */
export const listBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 10, 100);
  const { search, status, scope, staffId, from, to, sort } = req.query;
  const now = new Date();

  const filter = {};
  if (req.user.role === 'client') filter.client = req.user._id;
  else if (req.user.role === 'staff') filter.staff = req.user._id;
  else if (staffId && mongoose.isValidObjectId(staffId)) filter.staff = staffId;

  if (status && ['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) filter.status = status;

  if (scope === 'upcoming') {
    filter.startAt = { $gte: now };
    if (!filter.status) filter.status = { $in: ACTIVE_STATUSES };
  } else if (scope === 'past') {
    filter.startAt = { $lt: now };
  }

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = String(from);
    if (to) filter.date.$lte = String(to);
  }

  if (search && String(search).trim()) {
    const rx = { $regex: escapeRegex(String(search).trim()), $options: 'i' };
    filter.$or = [{ clientName: rx }, { clientEmail: rx }, { clientPhone: rx }, { serviceTitle: rx }, { staffName: rx }];
  }

  const sortMap = {
    date_asc: { startAt: 1 },
    date_desc: { startAt: -1 },
    newest: { createdAt: -1 },
  };
  const sortBy = sortMap[sort] || (scope === 'upcoming' ? sortMap.date_asc : sortMap.date_desc);

  const [items, total] = await Promise.all([
    Booking.find(filter).sort(sortBy).skip(skip).limit(limit).populate(POPULATE).lean(),
    Booking.countDocuments(filter),
  ]);

  const message = total ? `Заредихме ${total} ${total === 1 ? 'резервация' : 'резервации'}.` : 'Все още няма резервации тук.';
  return ApiResponse.ok(res, message, items, buildPaginationMeta(page, limit, total));
});

/** GET /api/bookings/stats – admin & staff dashboard */
export const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const base = req.user.role === 'staff' ? { staff: req.user._id } : {};
  const monthPrefix = todayStr().slice(0, 7);

  const [
    totalBookings,
    upcomingCount,
    pendingCount,
    completedCount,
    cancelledCount,
    revenueAgg,
    monthRevenueAgg,
    expectedAgg,
    upcoming,
    totalClients,
    totalServices,
    totalStaff,
  ] = await Promise.all([
    Booking.countDocuments(base),
    Booking.countDocuments({ ...base, startAt: { $gte: now }, status: { $in: ACTIVE_STATUSES } }),
    Booking.countDocuments({ ...base, status: 'pending', startAt: { $gte: now } }),
    Booking.countDocuments({ ...base, status: 'completed' }),
    Booking.countDocuments({ ...base, status: 'cancelled' }),
    Booking.aggregate([{ $match: { ...base, status: 'completed' } }, { $group: { _id: null, sum: { $sum: '$price' } } }]),
    Booking.aggregate([
      { $match: { ...base, status: 'completed', date: { $regex: `^${monthPrefix}` } } },
      { $group: { _id: null, sum: { $sum: '$price' } } },
    ]),
    Booking.aggregate([
      { $match: { ...base, status: { $in: ACTIVE_STATUSES }, startAt: { $gte: now } } },
      { $group: { _id: null, sum: { $sum: '$price' } } },
    ]),
    Booking.find({ ...base, startAt: { $gte: now }, status: { $in: ACTIVE_STATUSES } })
      .sort({ startAt: 1 })
      .limit(5)
      .populate(POPULATE)
      .lean(),
    req.user.role === 'admin'
      ? User.countDocuments({ role: 'client' })
      : Booking.distinct('clientName', base).then((list) => list.length),
    Service.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'staff', isActive: true }),
  ]);

  return ApiResponse.ok(res, 'Статистиката е заредена.', {
    totalBookings,
    upcomingCount,
    pendingCount,
    completedCount,
    cancelledCount,
    revenue: revenueAgg[0]?.sum || 0,
    revenueThisMonth: monthRevenueAgg[0]?.sum || 0,
    expectedRevenue: expectedAgg[0]?.sum || 0,
    totalClients,
    totalServices,
    totalStaff,
    upcoming,
  });
});

/** GET /api/bookings/:id */
export const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(POPULATE).lean();
  if (!booking || !canAccess(req.user, booking)) throw ApiError.notFound('Тази резервация не е намерена.');
  return ApiResponse.ok(res, 'Резервацията е заредена.', booking);
});

/** PATCH /api/bookings/:id/status */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking || !canAccess(req.user, booking)) throw ApiError.notFound('Тази резервация не е намерена.');

  if (booking.status === status) {
    throw ApiError.badRequest('Резервацията вече е в този статус.');
  }

  // Clients may only cancel their own upcoming bookings
  if (req.user.role === 'client') {
    if (status !== 'cancelled') throw ApiError.forbidden('Можеш само да откажеш своя резервация.');
    if (!ACTIVE_STATUSES.includes(booking.status)) {
      throw ApiError.badRequest('Тази резервация вече не може да бъде отказана.');
    }
    if (booking.startAt <= new Date()) throw ApiError.badRequest('Не можеш да откажеш резервация, която вече е минала.');

    booking.status = 'cancelled';
    await booking.save();
    await booking.populate(POPULATE);
    return ApiResponse.ok(res, 'Резервацията ти е отказана. Надяваме се да те видим скоро отново!', booking);
  }

  const allowed = TRANSITIONS[booking.status] || [];
  const adminOnly = ['cancelled', 'completed'].includes(booking.status);
  if (!allowed.includes(status) || (adminOnly && req.user.role !== 'admin')) {
    throw ApiError.badRequest('Тази промяна на статуса не е позволена.');
  }

  if (status === 'completed' && booking.startAt > new Date()) {
    throw ApiError.badRequest('Не можеш да завършиш резервация, която още не е започнала.');
  }

  // Re-opening a cancelled booking must re-check that the slot is still free
  if (booking.status === 'cancelled') {
    assertFuture(booking.date, booking.time);
    const staff = await User.findById(booking.staff);
    if (!staff) throw ApiError.notFound('Служителят по тази резервация вече не съществува.');
    await assertSlotAvailable({ staff, date: booking.date, time: booking.time, duration: booking.duration, excludeBookingId: booking._id });
  }

  booking.status = status;
  await booking.save();
  await booking.populate(POPULATE);
  return ApiResponse.ok(res, STATUS_MESSAGES[status], booking);
});

/** PUT /api/bookings/:id – admin full edit */
export const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Тази резервация не е намерена.');

  const serviceId = req.body.serviceId || booking.service;
  const staffId = req.body.staffId || booking.staff;
  const date = req.body.date || booking.date;
  const time = req.body.time || booking.time;

  const scheduleChanged =
    String(serviceId) !== String(booking.service) ||
    String(staffId) !== String(booking.staff) ||
    date !== booking.date ||
    time !== booking.time;

  const nextStatus = req.body.status || booking.status;

  if (scheduleChanged || (booking.status === 'cancelled' && nextStatus !== 'cancelled')) {
    const service = String(serviceId) !== String(booking.service) ? await loadService(serviceId) : await Service.findById(serviceId);
    if (!service) throw ApiError.notFound('Тази услуга вече не съществува.');
    const staff = await loadStaff(staffId);
    assertStaffOffers(staff, service);
    if (scheduleChanged) assertFuture(date, time);
    if (nextStatus !== 'cancelled') {
      await assertSlotAvailable({ staff, date, time, duration: service.duration, excludeBookingId: booking._id });
    }

    Object.assign(booking, {
      service: service._id,
      serviceTitle: service.title,
      staff: staff._id,
      staffName: staff.name,
      date,
      time,
      endTime: toHHMM(toMinutes(time) + service.duration),
      startAt: combineDateTime(date, time),
      duration: service.duration,
      price: String(service._id) !== String(booking.service) ? service.price : booking.price,
    });
  }

  if (req.body.status) booking.status = req.body.status;
  if (req.body.notes !== undefined) booking.notes = String(req.body.notes).trim();
  if (!booking.client) {
    if (req.body.clientName) booking.clientName = String(req.body.clientName).trim();
    if (req.body.clientEmail !== undefined) booking.clientEmail = String(req.body.clientEmail).trim();
    if (req.body.clientPhone !== undefined) booking.clientPhone = String(req.body.clientPhone).trim();
  }
  if (req.body.price !== undefined) booking.price = Number(req.body.price);

  await booking.save();
  await booking.populate(POPULATE);
  return ApiResponse.ok(res, 'Промените по резервацията са запазени.', booking);
});

/** DELETE /api/bookings/:id – admin */
export const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Тази резервация не е намерена.');
  await booking.deleteOne();
  return ApiResponse.ok(res, 'Резервацията е изтрита завинаги.', { _id: booking._id });
});
AIBT_FILE_END_7f3a

write_file 'backend/src/controllers/services.controller.js' <<'AIBT_FILE_END_7f3a'
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
AIBT_FILE_END_7f3a

write_file 'backend/src/controllers/staff.controller.js' <<'AIBT_FILE_END_7f3a'
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
AIBT_FILE_END_7f3a

write_file 'backend/src/middlewares/auth.middleware.js' <<'AIBT_FILE_END_7f3a'
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/jwt.js';

const MESSAGES = {
  missing: 'Не си влязъл в профила си. Моля, влез, за да продължиш.',
  invalid: 'Невалиден токен за достъп. Моля, влез отново.',
  expired: 'Сесията ти изтече. Моля, влез отново.',
  userGone: 'Профилът, свързан с тази сесия, вече не съществува. Моля, влез отново.',
  inactive: 'Профилът ти е деактивиран. Свържи се с администратор.',
  forbidden: 'Нямаш права за това действие.',
};

export const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    const token = header.slice(7).trim();
    if (token && token !== 'null' && token !== 'undefined') return token;
  }
  return req.cookies?.token || null;
};

const decodeOrThrow = (token) => {
  try {
    return verifyToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw ApiError.unauthorized(MESSAGES.expired);
    throw ApiError.unauthorized(MESSAGES.invalid);
  }
};

/** Requires a valid token. Distinguishes missing / invalid / expired. */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized(MESSAGES.missing);

  const decoded = decodeOrThrow(token);
  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized(MESSAGES.userGone);
  if (!user.isActive) throw ApiError.forbidden(MESSAGES.inactive);

  req.user = user;
  next();
});

/** Attaches req.user when a valid token is present; never blocks. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch {
    // invalid token on a public route – treat as guest
  }
  next();
});

/** Role guard – use after protect. */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized(MESSAGES.missing));
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden(MESSAGES.forbidden));
  next();
};
AIBT_FILE_END_7f3a

write_file 'backend/src/middlewares/error.middleware.js' <<'AIBT_FILE_END_7f3a'
import ApiError from '../utils/ApiError.js';

const isProd = () => process.env.NODE_ENV === 'production';

/** 404 for unknown API routes */
export const apiNotFound = (req, _res, next) => {
  next(new ApiError(404, 'Такъв маршрут не съществува', [{ field: 'route', message: `${req.method} ${req.originalUrl}` }]));
};

/** 404 for anything outside /api */
export const notFound = (req, _res, next) => {
  next(new ApiError(404, 'Такъв маршрут не съществува'));
};

const handleDuplicateKey = (err) => {
  const keys = Object.keys(err.keyPattern || err.keyValue || {});
  if (keys.includes('email')) {
    return ApiError.conflict('Този имейл вече е зает', [{ field: 'email', message: 'Този имейл вече е зает' }]);
  }
  if (keys.includes('staff') && keys.includes('time')) {
    return ApiError.conflict('Този час вече е зает, избери друг.', [
      { field: 'time', message: 'Хм, този час вече е зает. Избери друг.' },
    ]);
  }
  const field = keys[0] || 'field';
  return ApiError.conflict('Такъв запис вече съществува.', [{ field, message: 'Тази стойност вече е заета' }]);
};

/**
 * Converts any known error type into an ApiError.
 */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  // Mongoose validation
  if (err.name === 'ValidationError' && err.errors) {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.name === 'CastError' ? 'Невалидна стойност' : e.message,
    }));
    return ApiError.badRequest(
      errors.length === 1 ? errors[0].message : 'Има невалидни данни. Провери отбелязаните полета.',
      errors
    );
  }

  // Invalid ObjectId and other casts
  if (err.name === 'CastError') {
    return ApiError.badRequest('Невалиден идентификатор – такъв запис не съществува.', [
      { field: err.path, message: 'Невалидна стойност' },
    ]);
  }

  // Duplicate key
  if (err.code === 11000 || err.code === 11001) return handleDuplicateKey(err);

  if (err.name === 'DocumentNotFoundError') return ApiError.notFound('Записът не е намерен.');

  // JWT (in case thrown outside auth middleware)
  if (err.name === 'TokenExpiredError') return ApiError.unauthorized('Сесията ти изтече. Моля, влез отново.');
  if (err.name === 'JsonWebTokenError' || err.name === 'NotBeforeError') {
    return ApiError.unauthorized('Невалиден токен за достъп. Моля, влез отново.');
  }

  // body-parser errors
  if (err.type === 'entity.parse.failed') {
    return ApiError.badRequest('Невалиден JSON в заявката. Провери формата на изпратените данни.');
  }
  if (err.type === 'entity.too.large' || err.status === 413) {
    return ApiError.payloadTooLarge('Заявката е твърде голяма. Максималният размер е 100KB.');
  }
  if (err.type === 'encoding.unsupported' || err.type === 'charset.unsupported') {
    return ApiError.badRequest('Неподдържано кодиране на заявката.');
  }

  // Database unreachable
  if (
    ['MongooseServerSelectionError', 'MongoServerSelectionError', 'MongoNetworkError', 'MongoNotConnectedError'].includes(err.name) ||
    /buffering timed out/i.test(err.message || '')
  ) {
    return ApiError.unavailable('Базата данни не е свързана');
  }

  // Errors that already carry a status (e.g. from libraries)
  const status = err.statusCode || err.status;
  if (status && status >= 400 && status < 500) {
    return new ApiError(status, 'Невалидна заявка. Провери данните и опитай отново.');
  }

  return ApiError.internal();
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  const error = normalizeError(err);

  if (error.statusCode === 500) {
    console.error(`💥 [${req.method} ${req.originalUrl}]`, err);
  } else if (error.statusCode === 503 && !req.originalUrl.startsWith('/api/health')) {
    console.warn(`⚠️  [${req.method} ${req.originalUrl}] ${err.message}`);
  }

  if (res.headersSent) return;

  const body = {
    success: false,
    message: error.message,
    errors: error.errors || [],
  };
  if (!isProd() && error.statusCode === 500 && err.stack) body.stack = err.stack;

  res.status(error.statusCode).json(body);
};
AIBT_FILE_END_7f3a

write_file 'backend/src/middlewares/rateLimit.middleware.js' <<'AIBT_FILE_END_7f3a'
import rateLimit from 'express-rate-limit';
import ApiError from '../utils/ApiError.js';

const makeLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, _res, next) => next(ApiError.tooManyRequests(message)),
  });

/** General API limiter */
export const apiLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Твърде много заявки за кратко време. Изчакай няколко минути и опитай отново.',
});

/** Stricter limiter for login/register (brute-force protection) */
export const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Твърде много опити за вход. Изчакай 15 минути и опитай отново.',
});

/** AI endpoints limiter (protects the OpenAI budget) */
export const aiLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Пишеш ми твърде бързо 🙂 Изчакай минутка и опитай отново.',
});
AIBT_FILE_END_7f3a

write_file 'backend/src/middlewares/requireDb.middleware.js' <<'AIBT_FILE_END_7f3a'
import ApiError from '../utils/ApiError.js';
import { isDbConnected } from '../config/db.js';

/**
 * Fails fast with 503 instead of letting Mongoose buffer queries
 * for 10 seconds when the database is down.
 */
const requireDb = (_req, _res, next) => {
  if (!isDbConnected()) {
    return next(ApiError.unavailable('Базата данни не е свързана', [{ field: 'database', message: 'Изчакай малко и опитай отново.' }]));
  }
  next();
};

export default requireDb;
AIBT_FILE_END_7f3a

write_file 'backend/src/middlewares/validate.middleware.js' <<'AIBT_FILE_END_7f3a'
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
AIBT_FILE_END_7f3a

write_file 'backend/src/models/AIChatMessage.js' <<'AIBT_FILE_END_7f3a'
import mongoose from 'mongoose';

const aiChatMessageSchema = new mongoose.Schema(
  {
    sessionId: { type: String, trim: true, default: null, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 4000 },
    source: { type: String, enum: ['openai', 'mock'], default: 'mock' },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

// Chat history is kept for 30 days
aiChatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

aiChatMessageSchema.set('toJSON', { versionKey: false });

const AIChatMessage = mongoose.models.AIChatMessage || mongoose.model('AIChatMessage', aiChatMessageSchema);
export default AIChatMessage;
AIBT_FILE_END_7f3a

write_file 'backend/src/models/Booking.js' <<'AIBT_FILE_END_7f3a'
import mongoose from 'mongoose';

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];
export const ACTIVE_STATUSES = ['pending', 'confirmed'];

const bookingSchema = new mongoose.Schema(
  {
    // Registered client (optional – admin can book walk-in clients)
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    clientName: { type: String, required: [true, 'Името на клиента е задължително'], trim: true, maxlength: 60 },
    clientEmail: { type: String, trim: true, lowercase: true, default: '' },
    clientPhone: { type: String, trim: true, default: '' },

    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: [true, 'Услугата е задължителна'] },
    serviceTitle: { type: String, trim: true, default: '' },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Служителят е задължителен'] },
    staffName: { type: String, trim: true, default: '' },

    date: { type: String, required: [true, 'Датата е задължителна'], match: [/^\d{4}-\d{2}-\d{2}$/, 'Невалидна дата'] },
    time: { type: String, required: [true, 'Часът е задължителен'], match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Невалиден час'] },
    endTime: { type: String, required: true },
    startAt: { type: Date, required: true },
    duration: { type: Number, required: true, min: 5 },
    price: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: { values: BOOKING_STATUSES, message: 'Невалиден статус' },
      default: 'pending',
    },
    notes: { type: String, trim: true, default: '', maxlength: [500, 'Бележката може да е най-много 500 символа'] },
    // true for pending/confirmed/completed – used by the unique slot index
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Hard guarantee: one active booking per staff member per start time.
bookingSchema.index(
  { staff: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { active: true }, name: 'unique_active_slot' }
);
bookingSchema.index({ startAt: 1 });
bookingSchema.index({ client: 1, startAt: -1 });
bookingSchema.index({ staff: 1, date: 1 });

bookingSchema.pre('validate', function syncActive(next) {
  this.active = this.status !== 'cancelled';
  next();
});

bookingSchema.set('toJSON', { versionKey: false });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
export default Booking;
AIBT_FILE_END_7f3a

write_file 'backend/src/models/Service.js' <<'AIBT_FILE_END_7f3a'
import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Името на услугата е задължително'],
      trim: true,
      minlength: [2, 'Името трябва да е поне 2 символа'],
      maxlength: [100, 'Името може да е най-много 100 символа'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Описанието може да е най-много 2000 символа'],
    },
    price: {
      type: Number,
      required: [true, 'Цената е задължителна'],
      min: [0, 'Цената не може да е отрицателна'],
    },
    duration: {
      type: Number,
      required: [true, 'Продължителността е задължителна'],
      min: [5, 'Продължителността трябва да е поне 5 минути'],
      max: [600, 'Продължителността може да е най-много 600 минути'],
    },
    category: {
      type: String,
      required: [true, 'Категорията е задължителна'],
      trim: true,
      maxlength: [50, 'Категорията може да е най-много 50 символа'],
    },
    image: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceSchema.index({ title: 1 });
serviceSchema.index({ category: 1, isActive: 1 });

serviceSchema.set('toJSON', { versionKey: false });

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
export default Service;
AIBT_FILE_END_7f3a

write_file 'backend/src/models/User.js' <<'AIBT_FILE_END_7f3a'
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Името е задължително'],
      trim: true,
      minlength: [2, 'Името трябва да е поне 2 символа'],
      maxlength: [60, 'Името може да е най-много 60 символа'],
    },
    email: {
      type: String,
      required: [true, 'Имейлът е задължителен'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Въведи валиден имейл адрес'],
    },
    password: {
      type: String,
      required: [true, 'Паролата е задължителна'],
      minlength: [6, 'Паролата трябва да е поне 6 символа'],
      select: false,
    },
    phone: { type: String, trim: true, default: '' },
    role: {
      type: String,
      enum: { values: ['client', 'staff', 'admin'], message: 'Невалидна роля' },
      default: 'client',
    },
    isActive: { type: Boolean, default: true },

    // ---- Staff-only fields (ignored for clients/admins) ----
    position: { type: String, trim: true, default: '', maxlength: [60, 'Позицията може да е най-много 60 символа'] },
    bio: { type: String, trim: true, default: '', maxlength: [500, 'Описанието може да е най-много 500 символа'] },
    avatar: { type: String, trim: true, default: '' },
    // Empty array = staff member offers ALL services
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    // 0 = Sunday ... 6 = Saturday
    workingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5],
      validate: {
        validator: (arr) => arr.every((d) => Number.isInteger(d) && d >= 0 && d <= 6),
        message: 'Невалидни работни дни',
      },
    },
    workStart: { type: String, default: '09:00', match: [TIME_REGEX, 'Невалиден начален час'] },
    workEnd: { type: String, default: '18:00', match: [TIME_REGEX, 'Невалиден краен час'] },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
AIBT_FILE_END_7f3a

write_file 'backend/src/routes/ai.routes.js' <<'AIBT_FILE_END_7f3a'
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
AIBT_FILE_END_7f3a

write_file 'backend/src/routes/auth.routes.js' <<'AIBT_FILE_END_7f3a'
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
AIBT_FILE_END_7f3a

write_file 'backend/src/routes/bookings.routes.js' <<'AIBT_FILE_END_7f3a'
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
AIBT_FILE_END_7f3a

write_file 'backend/src/routes/health.routes.js' <<'AIBT_FILE_END_7f3a'
import { Router } from 'express';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { isDbConnected } from '../config/db.js';

const router = Router();
const PING_TIMEOUT_MS = 1500;

/** Tiny DB ping with a hard timeout – detects a dead DB faster than the driver heartbeat. */
const pingDb = async () => {
  if (!isDbConnected() || !mongoose.connection.db) return false;
  let timer;
  try {
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve(false), PING_TIMEOUT_MS);
    });
    const ping = mongoose.connection.db
      .admin()
      .command({ ping: 1 })
      .then(() => true)
      .catch(() => false);
    return await Promise.race([ping, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * GET /api/health – lightweight, not rate-limited.
 * 200 → { success: true, status: "ok", message: "Сървърът работи", uptime, dbStatus: "connected" }
 * 503 → { success: false, message: "Базата данни не е свързана" }
 */
router.get('/', async (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  const ok = await pingDb();
  if (!ok) {
    return next(ApiError.unavailable('Базата данни не е свързана', [{ field: 'dbStatus', message: 'disconnected' }]));
  }
  return ApiResponse.send(res, 200, 'Сървърът работи', null, undefined, {
    status: 'ok',
    uptime: Math.round(process.uptime()),
    dbStatus: 'connected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
AIBT_FILE_END_7f3a

write_file 'backend/src/routes/services.routes.js' <<'AIBT_FILE_END_7f3a'
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
AIBT_FILE_END_7f3a

write_file 'backend/src/routes/staff.routes.js' <<'AIBT_FILE_END_7f3a'
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
AIBT_FILE_END_7f3a

write_file 'backend/src/utils/ApiError.js' <<'AIBT_FILE_END_7f3a'
/**
 * Operational error with an HTTP status code and optional field errors.
 * errors: [{ field: 'email', message: 'Въведи валиден имейл' }]
 */
class ApiError extends Error {
  constructor(statusCode = 500, message = 'Ох, нещо се обърка при нас. Опитай отново след малко.', errors = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = Array.isArray(errors) ? errors : [];
    this.isOperational = true;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Невалидна заявка. Провери данните и опитай отново.', errors = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Не си влязъл в профила си. Моля, влез, за да продължиш.', errors = []) {
    return new ApiError(401, message, errors);
  }

  static forbidden(message = 'Нямаш права за това действие.', errors = []) {
    return new ApiError(403, message, errors);
  }

  static notFound(message = 'Не намерихме това, което търсиш.', errors = []) {
    return new ApiError(404, message, errors);
  }

  static conflict(message = 'Този запис вече съществува.', errors = []) {
    return new ApiError(409, message, errors);
  }

  static payloadTooLarge(message = 'Заявката е твърде голяма. Изпрати по-малко данни.') {
    return new ApiError(413, message);
  }

  static tooManyRequests(message = 'Твърде много заявки за кратко време. Изчакай малко и опитай отново.') {
    return new ApiError(429, message);
  }

  static internal(message = 'Ох, нещо се обърка при нас. Опитай отново след малко.') {
    return new ApiError(500, message);
  }

  static unavailable(message = 'Базата данни не е свързана', errors = []) {
    return new ApiError(503, message, errors);
  }
}

export default ApiError;
AIBT_FILE_END_7f3a

write_file 'backend/src/utils/ApiResponse.js' <<'AIBT_FILE_END_7f3a'
/**
 * Consistent success response:
 * { success: true, message: "...", data: ..., meta?: {...} }
 */
class ApiResponse {
  constructor(statusCode, message, data = null, meta = undefined, extra = undefined) {
    this.success = statusCode < 400;
    this.message = message;
    if (extra && typeof extra === 'object') Object.assign(this, extra);
    this.data = data;
    if (meta) this.meta = meta;
  }

  static send(res, statusCode, message, data = null, meta = undefined, extra = undefined) {
    return res.status(statusCode).json(new ApiResponse(statusCode, message, data, meta, extra));
  }

  static ok(res, message, data = null, meta = undefined) {
    return ApiResponse.send(res, 200, message, data, meta);
  }

  static created(res, message, data = null) {
    return ApiResponse.send(res, 201, message, data);
  }
}

export default ApiResponse;
AIBT_FILE_END_7f3a

write_file 'backend/src/utils/asyncHandler.js' <<'AIBT_FILE_END_7f3a'
/**
 * Wraps an async Express handler so any thrown error / rejected promise
 * is forwarded to the global error middleware. No try/catch duplication.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
AIBT_FILE_END_7f3a

write_file 'backend/src/utils/availability.js' <<'AIBT_FILE_END_7f3a'
import Booking from '../models/Booking.js';
import ApiError from './ApiError.js';
import {
  SLOT_STEP_MINUTES,
  toMinutes,
  toHHMM,
  dayOfWeek,
  combineDateTime,
} from './time.js';

/**
 * Returns true if the staff member offers the given service
 * (empty services array = offers everything).
 */
export const staffOffersService = (staff, serviceId) => {
  if (!staff.services || staff.services.length === 0) return true;
  return staff.services.some((id) => String(id) === String(serviceId));
};

/**
 * Computes free start times for a staff member on a given date.
 */
export const computeAvailableSlots = async ({ staff, duration, date, excludeBookingId = null }) => {
  if (!staff.workingDays?.includes(dayOfWeek(date))) return [];

  const workStart = toMinutes(staff.workStart || '09:00');
  const workEnd = toMinutes(staff.workEnd || '18:00');

  const filter = { staff: staff._id, date, active: true };
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };
  const bookings = await Booking.find(filter).select('time endTime').lean();
  const busy = bookings.map((b) => [toMinutes(b.time), toMinutes(b.endTime)]);

  const now = new Date();
  const slots = [];
  for (let start = workStart; start + duration <= workEnd; start += SLOT_STEP_MINUTES) {
    const end = start + duration;
    if (busy.some(([bs, be]) => start < be && end > bs)) continue;
    const time = toHHMM(start);
    if (combineDateTime(date, time) <= now) continue;
    slots.push(time);
  }
  return slots;
};

/**
 * Throws a friendly ApiError if the slot cannot be booked.
 */
export const assertSlotAvailable = async ({ staff, date, time, duration, excludeBookingId = null }) => {
  if (!staff.workingDays?.includes(dayOfWeek(date))) {
    throw ApiError.badRequest(`${staff.name} не работи в този ден. Избери друга дата.`, [
      { field: 'date', message: 'Служителят не работи в този ден' },
    ]);
  }

  const start = toMinutes(time);
  const end = start + duration;
  if (start < toMinutes(staff.workStart) || end > toMinutes(staff.workEnd)) {
    throw ApiError.badRequest(
      `Този час е извън работното време на ${staff.name} (${staff.workStart} – ${staff.workEnd}).`,
      [{ field: 'time', message: 'Часът е извън работното време' }]
    );
  }

  const filter = {
    staff: staff._id,
    date,
    active: true,
    time: { $lt: toHHMM(end) },
    endTime: { $gt: time },
  };
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };

  const overlapping = await Booking.findOne(filter).select('_id').lean();
  if (overlapping) {
    throw ApiError.conflict('Този час вече е зает, избери друг.', [
      { field: 'time', message: 'Хм, този час вече е зает. Избери друг.' },
    ]);
  }
};
AIBT_FILE_END_7f3a

write_file 'backend/src/utils/jwt.js' <<'AIBT_FILE_END_7f3a'
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const DEFAULT_EXPIRE = '7d';
const EXPIRE_PATTERN = /^\d+(\.\d+)?\s*(ms|s|m|h|d|w|y)?$/i;

let fallbackSecret = null;
let expireWarned = false;

/**
 * Returns JWT_SECRET from .env. If empty, generates a temporary random secret
 * so the app never crashes (all sessions reset on restart).
 */
export const getJwtSecret = () => {
  const secret = (process.env.JWT_SECRET || '').trim();
  if (secret) return secret;
  if (!fallbackSecret) {
    fallbackSecret = crypto.randomBytes(48).toString('hex');
    console.warn('⚠️  JWT_SECRET is empty – using a temporary random secret. Users will be logged out on every restart. Set JWT_SECRET in backend/.env');
  }
  return fallbackSecret;
};

export const getJwtExpire = () => {
  const value = (process.env.JWT_EXPIRE || '').trim();
  if (!value) return DEFAULT_EXPIRE;
  if (EXPIRE_PATTERN.test(value)) return /^\d+$/.test(value) ? Number(value) : value;
  if (!expireWarned) {
    expireWarned = true;
    console.warn(`⚠️  JWT_EXPIRE "${value}" is invalid – falling back to ${DEFAULT_EXPIRE}`);
  }
  return DEFAULT_EXPIRE;
};

export const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, getJwtSecret(), { expiresIn: getJwtExpire() });

export const verifyToken = (token) => jwt.verify(token, getJwtSecret());

export const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
};
AIBT_FILE_END_7f3a

write_file 'backend/src/utils/openai.js' <<'AIBT_FILE_END_7f3a'
// Thin OpenAI client over native fetch (Node 18+). Never used when the key is missing.

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';
const TIMEOUT_MS = 15000;

export const hasOpenAI = () => Boolean((process.env.OPENAI_API_KEY || '').trim());

/**
 * Calls the Chat Completions API. Throws on any failure –
 * callers must catch and fall back to the mock AI.
 */
export const callOpenAI = async ({ messages, json = false, maxTokens = 400, temperature = 0.6 }) => {
  if (!hasOpenAI()) throw new Error('OPENAI_API_KEY is not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY.trim()}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`OpenAI HTTP ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('OpenAI returned an empty response');
    return json ? JSON.parse(content) : content;
  } finally {
    clearTimeout(timer);
  }
};
AIBT_FILE_END_7f3a

write_file 'backend/src/utils/pagination.js' <<'AIBT_FILE_END_7f3a'
/**
 * Reads ?page & ?limit from the query string with safe bounds.
 */
export const getPagination = (query = {}, defaultLimit = 10, maxLimit = 50) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

export const buildPaginationMeta = (page, limit, total) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
AIBT_FILE_END_7f3a

write_file 'backend/src/utils/time.js' <<'AIBT_FILE_END_7f3a'
// Date/time helpers. Dates are stored as "YYYY-MM-DD", times as "HH:MM" (server local time).

export const CURRENCY = 'EUR';
export const SLOT_STEP_MINUTES = 30;

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const pad = (n) => String(n).padStart(2, '0');

export const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
};

export const toHHMM = (minutes) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

export const isValidDateStr = (value) => {
  if (!DATE_REGEX.test(String(value || ''))) return false;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  return toDateStr(d) === value;
};

export const isValidTimeStr = (value) => TIME_REGEX.test(String(value || ''));

export const toDateStr = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayStr = () => toDateStr(new Date());

export const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
};

export const dayOfWeek = (dateStr) => new Date(`${dateStr}T00:00:00`).getDay();

export const combineDateTime = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}:00`);

export const PART_OF_DAY = {
  morning: { from: 0, to: 12 * 60, label: 'сутринта' },
  midday: { from: 11 * 60, to: 14 * 60, label: 'по обед' },
  afternoon: { from: 12 * 60, to: 17 * 60 + 30, label: 'следобед' },
  evening: { from: 17 * 60, to: 24 * 60, label: 'вечерта' },
};

export const matchesPartOfDay = (timeStr, partOfDay) => {
  if (!partOfDay || !PART_OF_DAY[partOfDay]) return true;
  const m = toMinutes(timeStr);
  return m >= PART_OF_DAY[partOfDay].from && m < PART_OF_DAY[partOfDay].to;
};

const WEEKDAYS_BG = ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота'];
const MONTHS_BG = ['януари', 'февруари', 'март', 'април', 'май', 'юни', 'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'];

export const formatDateBg = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${WEEKDAYS_BG[d.getDay()]}, ${d.getDate()} ${MONTHS_BG[d.getMonth()]}`;
};

export const formatPrice = (value) =>
  new Intl.NumberFormat('bg-BG', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 }).format(Number(value) || 0);

export const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} мин`;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
};
AIBT_FILE_END_7f3a

write_file 'frontend/.env' <<'AIBT_FILE_END_7f3a'
# Адрес на бекенда, пример: http://localhost:5000/api - сложи твоя тук
VITE_API_URL=
AIBT_FILE_END_7f3a

write_file 'frontend/.env.example' <<'AIBT_FILE_END_7f3a'
# ============================================================
#  AI-Booking-Template-1 – настройки на фронтенда (пример)
#  Копирай този файл като .env и попълни СВОЯ адрес.
# ============================================================

# Адрес на бекенда, пример: http://localhost:5000/api - сложи твоя тук
# Ако е празно, фронтендът използва "/api" и Vite го пренасочва към http://localhost:5000 (само при npm run dev).
# За продукция (Vercel, Netlify и т.н.) ЗАДЪЛЖИТЕЛНО сложи пълния адрес на бекенда.
VITE_API_URL=
AIBT_FILE_END_7f3a

write_file 'frontend/index.html' <<'AIBT_FILE_END_7f3a'
<!doctype html>
<html lang="bg">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#4f46e5" />
    <meta name="description" content="AI Booking – онлайн резервации за бръснарници, салони, автомивки и студиа с AI асистент." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <title>AI Booking – онлайн резервации</title>
  </head>
  <body class="bg-slate-50 text-slate-800 antialiased">
    <noscript>Моля, включи JavaScript, за да използваш приложението.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
AIBT_FILE_END_7f3a

write_file 'frontend/package.json' <<'AIBT_FILE_END_7f3a'
{
  "name": "ai-booking-template-1-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "vite": "^5.4.11"
  }
}
AIBT_FILE_END_7f3a

write_file 'frontend/postcss.config.js' <<'AIBT_FILE_END_7f3a'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
AIBT_FILE_END_7f3a

write_file 'frontend/tailwind.config.js' <<'AIBT_FILE_END_7f3a'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgba(30, 27, 75, 0.18)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        'fade-in': 'fade-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
AIBT_FILE_END_7f3a

write_file 'frontend/vite.config.js' <<'AIBT_FILE_END_7f3a'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When VITE_API_URL is empty the app calls "/api" and Vite proxies it to the backend on port 5000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
AIBT_FILE_END_7f3a

write_file 'frontend/public/favicon.svg' <<'AIBT_FILE_END_7f3a'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1"/>
      <stop offset="1" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#g)"/>
  <rect x="14" y="18" width="36" height="32" rx="6" fill="none" stroke="#fff" stroke-width="4"/>
  <path d="M14 28h36M24 13v9M40 13v9" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
  <path d="M25 39l5 5 9-10" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
AIBT_FILE_END_7f3a

write_file 'frontend/src/App.jsx' <<'AIBT_FILE_END_7f3a'
import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import api from './api/axios.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import InlineFeedback from './components/InlineFeedback.jsx';
import AIChatWidget from './components/AIChatWidget.jsx';
import Home from './pages/Home.jsx';
import Services from './pages/Services.jsx';
import BookingPage from './pages/BookingPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AdminServices from './pages/AdminServices.jsx';
import NotFound from './pages/NotFound.jsx';

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 60000;

/* =========================================================================
 *  HEALTH GATE – nothing renders until GET /api/health succeeds
 * ========================================================================= */
function HealthGate({ children }) {
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (ready) return undefined;
    let cancelled = false;
    let timer = null;
    const startedAt = Date.now();
    setTimedOut(false);

    const check = async () => {
      try {
        const res = await api.get('/health', { timeout: 5000, skipGlobalHandler: true, params: { t: Date.now() } });
        if (!cancelled && res.data?.success && res.data?.dbStatus === 'connected') {
          setReady(true);
          return;
        }
      } catch {
        // 503 / network error → keep waiting
      }
      if (cancelled) return;
      if (Date.now() - startedAt >= TIMEOUT_MS) setTimedOut(true);
      // keep polling in the background even after the timeout message
      timer = setTimeout(check, POLL_INTERVAL_MS);
    };

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [attempt, ready]);

  // Block keyboard, scroll and focus while the server is not ready
  useEffect(() => {
    if (ready) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const blockKeys = (e) => {
      const isRetry = e.target?.closest?.('[role="alertdialog"] button');
      if (!isRetry) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', blockKeys, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', blockKeys, true);
    };
  }, [ready]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  if (!ready) return <LoadingScreen timedOut={timedOut} onRetry={retry} />;
  return children;
}

/* =========================================================================
 *  Global banners: offline / server down / flash messages from navigation
 * ========================================================================= */
function GlobalStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [networkError, setNetworkError] = useState('');
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    const on = () => {
      setOffline(false);
      setNetworkError('');
    };
    const off = () => setOffline(true);
    const onNetwork = (e) => setNetworkError(e.detail?.message || '');
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    window.addEventListener('api:network-error', onNetwork);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      window.removeEventListener('api:network-error', onNetwork);
    };
  }, []);

  // Pick up flash messages passed via navigate(..., { state: { flash } }),
  // keep them while on the same page, clear them when the page changes.
  useEffect(() => {
    if (location.state?.flash) {
      setFlash({ ...location.state.flash, pathname: location.pathname });
      navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    } else {
      setFlash((f) => (f && f.pathname !== location.pathname ? null : f));
    }
  }, [location, navigate]);

  if (!offline && !networkError && !flash) return null;

  return (
    <div className="container-page space-y-2 pt-4">
      {offline && <InlineFeedback type="warning" message="Нямаш интернет връзка. Някои действия няма да работят, докато не се свържеш отново." />}
      {!offline && networkError && <InlineFeedback type="error" message={networkError} onClose={() => setNetworkError('')} />}
      {flash && <InlineFeedback type={flash.type} message={flash.message} onClose={() => setFlash(null)} />}
    </div>
  );
}

function GuestOnly({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  // Only redirect users who were ALREADY logged in when opening the page;
  // a fresh login/register navigates by itself (with the server message).
  const [wasAuthenticatedOnMount] = useState(isAuthenticated);
  if (wasAuthenticatedOnMount && isAuthenticated) {
    const redirect = new URLSearchParams(location.search).get('redirect');
    return <Navigate to={redirect && redirect.startsWith('/') ? redirect : '/dashboard'} replace />;
  }
  return children;
}

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <GlobalStatus />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route
            path="/login"
            element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <Register />
              </GuestOnly>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminServices />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <AIChatWidget />
    </div>
  );
}

export default function App() {
  return (
    <HealthGate>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </HealthGate>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/index.css' <<'AIBT_FILE_END_7f3a'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-tap-highlight-color: transparent;
  }
  body {
    @apply min-h-screen bg-slate-50 font-sans text-slate-800;
  }
  ::selection {
    @apply bg-brand-200 text-brand-900;
  }
  :focus-visible {
    @apply outline-none ring-2 ring-brand-500 ring-offset-2;
  }
}

@layer components {
  .container-page {
    @apply mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8;
  }

  .card {
    @apply rounded-2xl border border-slate-200/80 bg-white shadow-soft;
  }

  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60;
  }
  .btn-primary {
    @apply btn bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:scale-[0.98];
  }
  .btn-secondary {
    @apply btn border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50;
  }
  .btn-ghost {
    @apply btn text-slate-600 hover:bg-slate-100 hover:text-slate-900;
  }
  .btn-danger {
    @apply btn bg-rose-600 text-white hover:bg-rose-700;
  }
  .btn-success {
    @apply btn bg-emerald-600 text-white hover:bg-emerald-700;
  }
  .btn-sm {
    @apply rounded-lg px-3 py-1.5 text-xs;
  }

  .label {
    @apply mb-1.5 block text-sm font-medium text-slate-700;
  }
  .input {
    @apply block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100;
  }
  .input-error {
    @apply border-rose-400 focus:border-rose-500 focus:ring-rose-100;
  }
  .field-error {
    @apply mt-1.5 text-xs font-medium text-rose-600;
  }

  .badge {
    @apply inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold;
  }

  .skeleton {
    @apply relative overflow-hidden rounded-lg bg-slate-200/80;
  }
  .skeleton::after {
    content: '';
    @apply absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent;
  }

  .section-title {
    @apply text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl;
  }
}

/* Scrollbar for dropdowns & chat */
.thin-scroll::-webkit-scrollbar {
  width: 6px;
}
.thin-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/main.jsx' <<'AIBT_FILE_END_7f3a'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
AIBT_FILE_END_7f3a

write_file 'frontend/src/api/axios.js' <<'AIBT_FILE_END_7f3a'
import axios from 'axios';

export const TOKEN_KEY = 'aibt_token';
export const USER_KEY = 'aibt_user';

/** VITE_API_URL from .env, falls back to "/api" (proxied by Vite in dev). */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '') || '/api';

// ---------- localStorage token handling (safe in private mode) ----------
export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      /* storage unavailable */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

const FALLBACK_MESSAGES = {
  400: 'Невалидна заявка. Провери данните и опитай отново.',
  401: 'Сесията ти изтече. Моля, влез отново.',
  403: 'Нямаш права за това действие.',
  404: 'Не намерихме това, което търсиш.',
  409: 'Възникна конфликт с вече съществуващи данни.',
  413: 'Изпратените данни са твърде големи.',
  429: 'Твърде много заявки. Изчакай малко и опитай отново.',
  500: 'Сървърът срещна проблем. Опитай отново след малко.',
  502: 'Сървърът временно не отговаря. Опитай отново след малко.',
  503: 'Сървърът временно не е наличен. Опитай отново след малко.',
  504: 'Сървърът отговаря твърде бавно. Опитай отново.',
};

/**
 * Turns any axios error into { status, message, errors, offline?, network? }.
 * The server message (res.data.message) always wins.
 */
export const normalizeError = (error) => {
  if (axios.isCancel(error)) {
    return { status: 0, message: 'Заявката беше прекъсната.', errors: [], canceled: true };
  }

  if (error?.response) {
    const { status, data } = error.response;
    const serverMessage = data && typeof data === 'object' && typeof data.message === 'string' ? data.message : null;
    return {
      status,
      message: serverMessage || FALLBACK_MESSAGES[status] || `Неочаквана грешка (код ${status}). Опитай отново.`,
      errors: Array.isArray(data?.errors) ? data.errors : [],
    };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { status: 0, message: 'Нямаш интернет връзка. Провери мрежата си и опитай отново.', errors: [], offline: true };
  }

  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return { status: 0, message: 'Сървърът отговаря твърде бавно. Опитай отново след малко.', errors: [], network: true };
  }

  return {
    status: 0,
    message: 'Не успяхме да се свържем със сървъра. Провери дали работи и опитай отново.',
    errors: [],
    network: true,
  };
};

/** Converts server errors array into { field: message } for inputs. */
export const getFieldErrors = (errors = []) =>
  errors.reduce((acc, item) => {
    if (item?.field && item?.message && !acc[item.field]) acc[item.field] = item.message;
    return acc;
  }, {});

/** Shortcut to get the normalized feedback from any thrown error. */
export const getErrorFeedback = (error) => error?.feedback || normalizeError(error);

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// ---------- Request: attach token ----------
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register'];

// ---------- Response: normalize + global handling ----------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const feedback = normalizeError(error);
    error.feedback = feedback;

    const url = error.config?.url || '';
    const skip = error.config?.skipGlobalHandler;

    if (!skip) {
      if (feedback.status === 401 && !AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint))) {
        // Expired / invalid session → AuthContext clears state and redirects to /login
        tokenStorage.clear();
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { message: feedback.message, redirect: true } }));
      } else if (feedback.status === 403) {
        window.dispatchEvent(new CustomEvent('api:forbidden', { detail: feedback }));
      } else if (feedback.network || feedback.offline) {
        window.dispatchEvent(new CustomEvent('api:network-error', { detail: feedback }));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/AIChatWidget.jsx' <<'AIBT_FILE_END_7f3a'
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorFeedback } from '../api/axios.js';
import InlineFeedback from './InlineFeedback.jsx';

const SESSION_KEY = 'aibt_chat_session';
const HISTORY_KEY = 'aibt_chat_history';
const MAX_STORED = 30;

const QUICK_PROMPTS = ['Искам час в петък следобед', 'Какви услуги предлагате?', 'Колко струва подстригване?', 'Свободно ли е утре сутринта?'];

const WELCOME = {
  role: 'assistant',
  content:
    'Здравей! 👋 Аз съм AI асистентът за резервации. Кажи ми каква услуга искаш и кога ти е удобно – например „Искам подстригване в петък следобед“.',
  suggestions: [],
};

const getSessionId = () => {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
};

const loadHistory = () => {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : [WELCOME];
  } catch {
    return [WELCOME];
  }
};

export default function AIChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      /* storage unavailable */
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const send = async (text) => {
    const message = String(text ?? input).trim();
    if (!message || sending) return;
    if (message.length > 500) {
      setError('Съобщението е твърде дълго – до 500 символа.');
      return;
    }

    setError('');
    setInput('');
    const history = messages.filter((m) => m !== WELCOME).slice(-8).map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setSending(true);

    try {
      const res = await api.post('/ai/chat', { message, sessionId: sessionId.current, history });
      const { reply, suggestions = [] } = res.data.data || {};
      setMessages((prev) => [...prev, { role: 'assistant', content: reply || res.data.message, suggestions }]);
    } catch (err) {
      const fb = getErrorFeedback(err);
      setError(fb.message);
    } finally {
      setSending(false);
    }
  };

  const pickSuggestion = (s) => {
    const params = new URLSearchParams({ service: s.serviceId, staff: s.staffId, date: s.date, time: s.time });
    setOpen(false);
    navigate(`/booking?${params.toString()}`);
  };

  const resetChat = () => {
    setMessages([WELCOME]);
    setError('');
  };

  return (
    <>
      {open && (
        <section
          className="fixed bottom-24 right-4 z-[80] flex h-[min(560px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] animate-fade-in flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:right-6"
          aria-label="AI асистент за резервации"
          role="dialog"
        >
          <header className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-purple-600 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">🤖</div>
              <div>
                <p className="text-sm font-bold">AI асистент</p>
                <p className="text-xs text-white/80">Помага ти да запазиш час</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={resetChat} className="rounded-lg px-2 py-1 text-xs text-white/80 hover:bg-white/15 hover:text-white" title="Нов разговор">
                Изчисти
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-white/15" aria-label="Затвори чата">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </header>

          <div ref={listRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user' ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {m.content}
                  {m.suggestions?.length > 0 && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      {m.suggestions.map((s, idx) => (
                        <button
                          key={`${s.staffId}-${s.date}-${s.time}-${idx}`}
                          type="button"
                          onClick={() => pickSuggestion(s)}
                          className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-left text-xs font-semibold text-brand-700 transition hover:border-brand-400 hover:bg-brand-100"
                        >
                          📅 {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3" aria-label="Зарежда...">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            )}

            {messages.length <= 1 && !sending && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p} type="button" onClick={() => send(p)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-brand-300 hover:text-brand-700">
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="px-3 pt-3">
              <InlineFeedback type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError('');
              }}
              maxLength={500}
              placeholder="Напиши съобщение..."
              className="input flex-1"
              disabled={sending}
              aria-label="Съобщение до AI асистента"
            />
            <button type="submit" className="btn-primary px-3" disabled={sending || !input.trim()} aria-label="Изпрати">
              {sending ? (
                'Зарежда...'
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M3.1 2.3a.75.75 0 01.8-.1l13 7a.75.75 0 010 1.3l-13 7a.75.75 0 01-1-.9L5 10 2.9 3.1a.75.75 0 01.2-.8zM6.4 10.75l-1.6 5.1 9.6-5.1H6.4zm8-1.5L4.8 4.2l1.6 5.05h8z" />
                </svg>
              )}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-purple-600 text-white shadow-xl transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-200 sm:right-6"
        aria-label={open ? 'Затвори AI асистента' : 'Отвори AI асистента'}
        aria-expanded={open}
      >
        {open ? (
          <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        ) : (
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.4-4 8-9 8a9.9 9.9 0 01-4.3-.9L3 20l1.3-3.9A7.7 7.7 0 013 12c0-4.4 4-8 9-8s9 3.6 9 8z" />
          </svg>
        )}
      </button>
    </>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/Calendar.jsx' <<'AIBT_FILE_END_7f3a'
import { useMemo, useState } from 'react';
import { MONTHS, WEEKDAYS_SHORT, toDateStr, todayStr, parseDateStr } from '../utils/format.js';

/**
 * Month calendar (Monday first).
 * Props: value (YYYY-MM-DD), onChange(dateStr), isDateDisabled(dateStr) → boolean, maxDaysAhead
 */
export default function Calendar({ value, onChange, isDateDisabled, maxDaysAhead = 90 }) {
  const initial = value ? parseDateStr(value) : new Date();
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });

  const today = todayStr();
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + maxDaysAhead);
    return toDateStr(d);
  }, [maxDaysAhead]);

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const offset = (first.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const list = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d += 1) list.push(toDateStr(new Date(view.year, view.month, d)));
    return list;
  }, [view]);

  const currentMonthStart = toDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const viewMonthStart = toDateStr(new Date(view.year, view.month, 1));
  const canPrev = viewMonthStart > currentMonthStart;
  const canNext = toDateStr(new Date(view.year, view.month + 1, 1)) <= maxDate;

  const shift = (delta) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} disabled={!canPrev} className="btn-ghost btn-sm" aria-label="Предишен месец">
          ←
        </button>
        <p className="text-sm font-bold text-slate-800">
          {MONTHS[view.month]} {view.year}
        </p>
        <button type="button" onClick={() => shift(1)} disabled={!canNext} className="btn-ghost btn-sm" aria-label="Следващ месец">
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1" role="grid" aria-label="Календар">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const disabled = date < today || date > maxDate || (isDateDisabled ? isDateDisabled(date) : false);
          const selected = date === value;
          const isToday = date === today;
          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onChange(date)}
              aria-pressed={selected}
              aria-label={date}
              className={`aspect-square rounded-xl text-sm font-medium transition ${
                selected
                  ? 'bg-brand-600 text-white shadow-md'
                  : disabled
                    ? 'cursor-not-allowed text-slate-300 line-through decoration-slate-200'
                    : 'text-slate-700 hover:bg-brand-50 hover:text-brand-700'
              } ${isToday && !selected ? 'ring-1 ring-brand-300' : ''}`}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/ConfirmModal.jsx' <<'AIBT_FILE_END_7f3a'
import { useEffect, useRef } from 'react';
import InlineFeedback from './InlineFeedback.jsx';

/**
 * Confirmation dialog for destructive actions.
 */
export default function ConfirmModal({
  open,
  title = 'Сигурен ли си?',
  message = 'Това действие не може да бъде отменено.',
  confirmText = 'Изтрий',
  cancelText = 'Отказ',
  variant = 'danger',
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => cancelRef.current?.focus(), 0);
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !loading && onCancel?.()} aria-hidden="true" />
      <div className="card relative w-full max-w-md animate-fade-in p-6">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-rose-100' : 'bg-brand-100'}`}>
            <svg className={`h-6 w-6 ${variant === 'danger' ? 'text-rose-600' : 'text-brand-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-lg font-bold text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{message}</p>
          </div>
        </div>

        {error && <InlineFeedback type="error" message={error} className="mt-4" />}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button type="button" className={variant === 'danger' ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={loading}>
            {loading ? 'Зарежда...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/CustomDropdown.jsx' <<'AIBT_FILE_END_7f3a'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * Fully custom dropdown – the ONLY dropdown in the project (no native <select>).
 *
 * Props:
 *  - options: [{ value, label, description? }]
 *  - value, onChange(value, option)
 *  - placeholder, label, name, id
 *  - searchable (default true), searchPlaceholder
 *  - clearable (default false)
 *  - disabled, error (string | boolean)
 *  - emptyText, className, buttonClassName, size: 'md' | 'sm'
 *  - onBlur(name)
 */
export default function CustomDropdown({
  options = [],
  value = '',
  onChange,
  placeholder = 'Избери...',
  label,
  name,
  id,
  searchable = true,
  searchPlaceholder = 'Търси...',
  clearable = false,
  disabled = false,
  error,
  emptyText = 'Няма намерени резултати',
  className = '',
  buttonClassName = '',
  size = 'md',
  onBlur,
}) {
  const autoId = useId();
  const dropdownId = id || `dropdown-${autoId}`;
  const listId = `${dropdownId}-list`;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);

  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selected = useMemo(() => options.find((o) => String(o.value) === String(value)) || null, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.description || ''}`.toLowerCase().includes(q));
  }, [options, query]);

  const close = useCallback(
    (focusButton = false) => {
      setOpen(false);
      setQuery('');
      if (focusButton) buttonRef.current?.focus();
      onBlur?.(name);
    },
    [name, onBlur]
  );

  const openMenu = () => {
    if (disabled) return;
    const idx = filtered.findIndex((o) => String(o.value) === String(value));
    setHighlight(idx >= 0 ? idx : 0);
    setOpen(true);
  };

  const selectOption = (option) => {
    if (!option || option.disabled) return;
    onChange?.(option.value, option);
    close(true);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return undefined;
    const onDocMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) close(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('touchstart', onDocMouseDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('touchstart', onDocMouseDown);
    };
  }, [open, close]);

  // Focus search on open
  useEffect(() => {
    if (open && searchable) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open, searchable]);

  // Keep highlight in range
  useEffect(() => {
    if (highlight > filtered.length - 1) setHighlight(Math.max(0, filtered.length - 1));
  }, [filtered.length, highlight]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${highlight}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  // Close if disabled while open
  useEffect(() => {
    if (disabled && open) close(false);
  }, [disabled, open, close]);

  const moveHighlight = (dir) => {
    if (!filtered.length) return;
    setHighlight((h) => {
      let next = h;
      for (let i = 0; i < filtered.length; i += 1) {
        next = (next + dir + filtered.length) % filtered.length;
        if (!filtered[next].disabled) break;
      }
      return next;
    });
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) openMenu();
        else moveHighlight(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) openMenu();
        else moveHighlight(-1);
        break;
      case 'Enter':
        e.preventDefault();
        if (!open) openMenu();
        else selectOption(filtered[highlight]);
        break;
      case ' ':
        if (!open && e.target === buttonRef.current) {
          e.preventDefault();
          openMenu();
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          e.stopPropagation();
          close(true);
        }
        break;
      case 'Tab':
        if (open) close(false);
        break;
      case 'Home':
        if (open) {
          e.preventDefault();
          setHighlight(0);
        }
        break;
      case 'End':
        if (open) {
          e.preventDefault();
          setHighlight(Math.max(0, filtered.length - 1));
        }
        break;
      default:
    }
  };

  const hasError = Boolean(error);
  const sizeClasses = size === 'sm' ? 'px-3 py-2 text-xs rounded-lg' : 'px-3.5 py-2.5 text-sm rounded-xl';

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {label && (
        <label htmlFor={dropdownId} className="label">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={buttonRef}
          id={dropdownId}
          type="button"
          name={name}
          disabled={disabled}
          onClick={() => (open ? close(false) : openMenu())}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={hasError}
          className={`flex w-full items-center justify-between gap-2 border bg-white text-left shadow-sm transition ${sizeClasses} ${
            hasError
              ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
              : open
                ? 'border-brand-500 ring-4 ring-brand-100'
                : 'border-slate-200 hover:border-slate-300'
          } ${disabled ? 'cursor-not-allowed bg-slate-100 opacity-70' : 'cursor-pointer'} focus:outline-none ${
            clearable && selected ? 'pr-16' : 'pr-10'
          } ${buttonClassName}`}
        >
          <span className={`truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>{selected ? selected.label : placeholder}</span>

        </button>
          <svg
            className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>

        {clearable && selected && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange?.('', null);
              onBlur?.(name);
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Изчисти избора"
            title="Изчисти"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[12rem] animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {searchable && (
            <div className="border-b border-slate-100 p-2">
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                aria-label={searchPlaceholder}
                aria-controls={listId}
                aria-activedescendant={filtered[highlight] ? `${dropdownId}-opt-${highlight}` : undefined}
              />
            </div>
          )}

          <ul ref={listRef} id={listId} role="listbox" className="thin-scroll max-h-60 overflow-y-auto py-1" aria-labelledby={dropdownId}>
            {filtered.length === 0 && <li className="px-4 py-3 text-sm text-slate-400">{emptyText}</li>}
            {filtered.map((option, index) => {
              const isSelected = String(option.value) === String(value);
              const isHighlighted = index === highlight;
              return (
                <li
                  key={`${option.value}`}
                  id={`${dropdownId}-opt-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(option)}
                  className={`mx-1 flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                    option.disabled ? 'cursor-not-allowed opacity-40' : ''
                  } ${isHighlighted ? 'bg-brand-50 text-brand-800' : 'text-slate-700'} ${isSelected ? 'font-semibold' : ''}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.description && <span className="block truncate text-xs text-slate-400">{option.description}</span>}
                  </span>
                  {isSelected && (
                    <svg className="h-4 w-4 shrink-0 text-brand-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {typeof error === 'string' && error && <p className="field-error">{error}</p>}
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/EmptyState.jsx' <<'AIBT_FILE_END_7f3a'
import { Link } from 'react-router-dom';

/**
 * Friendly placeholder for empty lists with a call-to-action.
 */
export default function EmptyState({
  title = 'Все още няма нищо тук',
  description = 'Когато се появят данни, ще ги видиш тук.',
  actionLabel,
  actionTo,
  onAction,
  icon,
  className = '',
}) {
  return (
    <div className={`card flex flex-col items-center px-6 py-14 text-center ${className}`}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-purple-100 text-brand-600">
        {icon || (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0h-4.5l-1.5 2h-4l-1.5-2H4" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary mt-6">
          {actionLabel}
        </Link>
      )}
      {actionLabel && !actionTo && onAction && (
        <button type="button" onClick={onAction} className="btn-primary mt-6">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/ErrorBoundary.jsx' <<'AIBT_FILE_END_7f3a'
import { Component } from 'react';

/**
 * Catches render errors anywhere in the tree and shows a friendly fallback.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleRetry = this.handleRetry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Keep a trace for developers; the user sees the fallback UI
    console.error('ErrorBoundary caught an error:', error, info?.componentStack);
  }

  handleRetry() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="card w-full max-w-lg p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100">
            <svg className="h-8 w-8 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ох, нещо се обърка</h1>
          <p className="mt-2 text-sm text-slate-600">
            Възникна неочаквана грешка в приложението. Опитай отново – ако проблемът продължава, презареди страницата.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="thin-scroll mt-4 max-h-40 overflow-auto rounded-xl bg-slate-900 p-3 text-left text-xs text-rose-200">
              {String(this.state.error?.stack || this.state.error)}
            </pre>
          )}
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button type="button" className="btn-primary" onClick={this.handleRetry}>
              Опитай отново
            </button>
            <button type="button" className="btn-secondary" onClick={() => window.location.assign('/')}>
              Към началото
            </button>
          </div>
        </div>
      </div>
    );
  }
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/Footer.jsx' <<'AIBT_FILE_END_7f3a'
import { Link } from 'react-router-dom';
import { Logo } from './Navbar.jsx';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-slate-500">
            Онлайн резервации с AI асистент за бръснарници, салони за красота, автомивки и фото студиа. Без телефонни обаждания, без чакане.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Навигация</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/services" className="hover:text-brand-600">Услуги</Link></li>
            <li><Link to="/booking" className="hover:text-brand-600">Резервирай час</Link></li>
            <li><Link to="/dashboard" className="hover:text-brand-600">Моето табло</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Профил</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link to="/login" className="hover:text-brand-600">Вход</Link></li>
            <li><Link to="/register" className="hover:text-brand-600">Регистрация</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-400 sm:flex-row">
          <p>© {year} AI Booking. Всички права запазени.</p>
          <p>Създадено с ❤️ и малко изкуствен интелект</p>
        </div>
      </div>
    </footer>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/InlineFeedback.jsx' <<'AIBT_FILE_END_7f3a'
const STYLES = {
  success: {
    box: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: 'text-emerald-500',
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z',
  },
  error: {
    box: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: 'text-rose-500',
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 00-1.4 1.4L8.6 10l-1.3 1.3a1 1 0 101.4 1.4l1.3-1.3 1.3 1.3a1 1 0 001.4-1.4L11.4 10l1.3-1.3a1 1 0 00-1.4-1.4L10 8.6 8.7 7.3z',
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: 'text-amber-500',
    path: 'M8.3 2.9a2 2 0 013.4 0l6.1 10.6A2 2 0 0116.1 16.5H3.9a2 2 0 01-1.7-3l6.1-10.6zM10 6a1 1 0 00-1 1v3a1 1 0 102 0V7a1 1 0 00-1-1zm0 8a1 1 0 100-2 1 1 0 000 2z',
  },
  info: {
    box: 'border-sky-200 bg-sky-50 text-sky-800',
    icon: 'text-sky-500',
    path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 11-2 0 1 1 0 012 0zm-2 3a1 1 0 112 0v4a1 1 0 11-2 0v-4z',
  },
};

/**
 * Inline, server-driven feedback box (no toasts).
 * Props: type ('success' | 'error' | 'warning' | 'info'), message, errors (server array), onClose, className, children
 */
export default function InlineFeedback({ type = 'info', message, errors = [], onClose, className = '', children }) {
  if (!message && !children) return null;
  const style = STYLES[type] || STYLES.info;
  const listErrors = (errors || []).filter((e) => e?.message && e.message !== message);

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={`flex animate-fade-in items-start gap-3 rounded-xl border px-4 py-3 text-sm ${style.box} ${className}`}
    >
      <svg className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d={style.path} clipRule="evenodd" />
      </svg>
      <div className="min-w-0 flex-1">
        {message && <p className="font-medium leading-relaxed">{message}</p>}
        {listErrors.length > 1 && (
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs opacity-90">
            {listErrors.map((e, i) => (
              <li key={`${e.field}-${i}`}>{e.message}</li>
            ))}
          </ul>
        )}
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="-m-1 rounded-lg p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"
          aria-label="Затвори съобщението"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/LoadingScreen.jsx' <<'AIBT_FILE_END_7f3a'
/**
 * Full-screen blocking loader used by the health gate.
 * Covers everything, captures all pointer events.
 */
export default function LoadingScreen({ timedOut = false, onRetry, retrying = false }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex select-none items-center justify-center bg-gradient-to-br from-brand-50 via-white to-purple-50 px-6"
      role="alertdialog"
      aria-modal="true"
      aria-busy={!timedOut}
      aria-labelledby="loading-title"
      aria-describedby="loading-desc"
      style={{ pointerEvents: 'all', touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex max-w-md flex-col items-center text-center">
        {!timedOut ? (
          <div className="relative mb-8 h-20 w-20" aria-hidden="true">
            <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-brand-600" />
            <div className="absolute inset-3 animate-pulse rounded-full bg-gradient-to-br from-brand-500 to-purple-500 opacity-80" />
          </div>
        ) : (
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100" aria-hidden="true">
            <svg className="h-10 w-10 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          </div>
        )}

        <h1 id="loading-title" className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          сървърът зарежда...
        </h1>
        <p id="loading-desc" className="mt-3 text-sm lowercase text-slate-500">
          това може да отнеме известно време, моля изчакай малко
        </p>

        {timedOut && (
          <div className="mt-8 w-full animate-fade-in">
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="alert">
              Сървърът не отговаря. Провери връзката си и опитай отново.
            </p>
            <button type="button" onClick={onRetry} disabled={retrying} className="btn-primary mt-4 w-full sm:w-auto" autoFocus>
              {retrying ? 'Зарежда...' : 'Опитай отново'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/Modal.jsx' <<'AIBT_FILE_END_7f3a'
import { useEffect } from 'react';

/** Generic modal used for create/edit forms. */
export default function Modal({ open, title, onClose, children, footer, size = 'lg', busy = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy && !e.defaultPrevented) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, busy, onClose]);

  if (!open) return null;
  const width = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size] || 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !busy && onClose?.()} aria-hidden="true" />
      <div className={`relative flex max-h-[92vh] w-full ${width} animate-fade-in flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id="modal-title" className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Затвори">
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <div className="thin-scroll flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/Navbar.jsx' <<'AIBT_FILE_END_7f3a'
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABELS } from '../utils/format.js';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`;

const mobileLinkClass = ({ isActive }) =>
  `block rounded-xl px-4 py-3 text-base font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'}`;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="AI Booking – начало">
      <img src="/favicon.svg" alt="" className="h-9 w-9" />
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        AI<span className="text-brand-600">Booking</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();

  // Close mobile menu on navigation
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
  };

  const links = [
    { to: '/', label: 'Начало', end: true },
    { to: '/services', label: 'Услуги' },
    { to: '/booking', label: 'Резервирай' },
    ...(isAuthenticated ? [{ to: '/dashboard', label: 'Табло' }] : []),
    ...(isAdmin ? [{ to: '/admin/services', label: 'Управление' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-lg">
      <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Основна навигация">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <div className="mr-1 text-right leading-tight">
                <p className="max-w-[10rem] truncate text-sm font-semibold text-slate-800">{user?.name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role] || ''}</p>
              </div>
              <button type="button" onClick={handleLogout} className="btn-secondary" disabled={loggingOut}>
                {loggingOut ? 'Зарежда...' : 'Изход'}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Вход
              </Link>
              <Link to="/register" className="btn-primary">
                Регистрация
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Затвори менюто' : 'Отвори менюто'}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="animate-fade-in border-t border-slate-200 bg-white md:hidden">
          <div className="container-page space-y-1 py-4">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={mobileLinkClass}>
                {l.label}
              </NavLink>
            ))}
            <div className="mt-3 border-t border-slate-100 pt-3">
              {isAuthenticated ? (
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{user?.name}</p>
                    <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role] || ''}</p>
                  </div>
                  <button type="button" onClick={handleLogout} className="btn-secondary" disabled={loggingOut}>
                    {loggingOut ? 'Зарежда...' : 'Изход'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" className="btn-secondary">
                    Вход
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/Pagination.jsx' <<'AIBT_FILE_END_7f3a'
/** Builds a compact page list like: 1 … 4 5 6 … 12 */
export const getPageNumbers = (page, totalPages) => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push('…');
    result.push(p);
  });
  return result;
};

export default function Pagination({ page = 1, totalPages = 1, total, onChange, disabled = false }) {
  if (totalPages <= 1) return null;
  const go = (p) => {
    if (p < 1 || p > totalPages || p === page || disabled) return;
    onChange(p);
  };

  return (
    <nav className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row" aria-label="Страници">
      <p className="text-sm text-slate-500">
        Страница <span className="font-semibold text-slate-700">{page}</span> от <span className="font-semibold text-slate-700">{totalPages}</span>
        {typeof total === 'number' && <> · {total} резултата</>}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" className="btn-secondary btn-sm" onClick={() => go(page - 1)} disabled={page <= 1 || disabled} aria-label="Предишна страница">
          ← Назад
        </button>
        {getPageNumbers(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`dots-${i}`} className="px-2 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              disabled={disabled}
              aria-current={p === page ? 'page' : undefined}
              className={`h-8 min-w-[2rem] rounded-lg px-2 text-xs font-semibold transition ${
                p === page ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button type="button" className="btn-secondary btn-sm" onClick={() => go(page + 1)} disabled={page >= totalPages || disabled} aria-label="Следваща страница">
          Напред →
        </button>
      </div>
    </nav>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/PasswordInput.jsx' <<'AIBT_FILE_END_7f3a'
import { useState } from 'react';

/** Password input with show/hide toggle. */
export default function PasswordInput({ id, name, value, onChange, onBlur, placeholder, error, autoComplete = 'current-password', disabled }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`input pr-12 ${error ? 'input-error' : ''}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label={visible ? 'Скрий паролата' : 'Покажи паролата'}
        tabIndex={-1}
      >
        {visible ? 'Скрий' : 'Покажи'}
      </button>
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/ProtectedRoute.jsx' <<'AIBT_FILE_END_7f3a'
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Guards routes: no token → /login, wrong role → 403 page.
 */
export default function ProtectedRoute({ children, roles }) {
  const { token, user, checking } = useAuth();
  const location = useLocation();

  if (!token) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return (
      <Navigate
        to={`/login?redirect=${redirect}`}
        replace
        state={{ flash: { type: 'info', message: 'Влез в профила си, за да продължиш.' } }}
      />
    );
  }

  if (checking && !user) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" aria-label="Зарежда..." />
      </div>
    );
  }

  if (roles?.length && user && !roles.includes(user.role)) {
    return (
      <div className="container-page flex min-h-[60vh] items-center justify-center py-16">
        <div className="card max-w-md p-8 text-center">
          <p className="bg-gradient-to-br from-rose-500 to-amber-500 bg-clip-text text-6xl font-extrabold text-transparent">403</p>
          <h1 className="mt-3 text-xl font-bold text-slate-900">Нямаш достъп до тази страница</h1>
          <p className="mt-2 text-sm text-slate-600">Тази секция е само за администратори. Ако мислиш, че е грешка, свържи се с нас.</p>
          <Link to="/dashboard" className="btn-primary mt-6">
            Към моето табло
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/ServiceCard.jsx' <<'AIBT_FILE_END_7f3a'
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatPrice } from '../utils/format.js';

const GRADIENTS = [
  'from-brand-500 to-purple-500',
  'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-orange-400',
  'from-amber-500 to-pink-500',
];

export function ServiceImage({ service, className = 'h-44', compact = false }) {
  const [failed, setFailed] = useState(false);
  const gradient = GRADIENTS[(service.title || '').length % GRADIENTS.length];

  if (!service.image || failed) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}>
        {compact ? (
          <span className="text-xl font-extrabold text-white/95">{(service.title || '?').charAt(0)}</span>
        ) : (
          <span className="px-4 text-center text-lg font-bold text-white/95 drop-shadow">{service.title}</span>
        )}
      </div>
    );
  }
  return <img src={service.image} alt={service.title} loading="lazy" onError={() => setFailed(true)} className={`w-full object-cover ${className}`} />;
}

export default function ServiceCard({ service, onSelect, selected = false, actionLabel = 'Резервирай' }) {
  return (
    <article
      className={`card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-xl ${selected ? 'ring-2 ring-brand-500' : ''}`}
    >
      <div className="relative overflow-hidden">
        <ServiceImage service={service} />
        <span className="badge absolute left-3 top-3 bg-white/90 text-slate-700 backdrop-blur">{service.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-slate-900">{service.title}</h3>
        <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-500">{service.description || 'Описанието скоро ще бъде добавено.'}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xl font-extrabold text-slate-900">{formatPrice(service.price)}</p>
            <p className="text-xs text-slate-500">⏱ {formatDuration(service.duration)}</p>
          </div>
          {onSelect ? (
            <button type="button" onClick={() => onSelect(service)} className={selected ? 'btn-success' : 'btn-primary'}>
              {selected ? '✓ Избрана' : 'Избери'}
            </button>
          ) : (
            <Link to={`/booking?service=${service._id}`} className="btn-primary">
              {actionLabel}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/components/Skeleton.jsx' <<'AIBT_FILE_END_7f3a'
/** Skeleton loaders shown while lists are loading. */

export function SkeletonCard() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="skeleton h-44 rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-5/6" />
        <div className="flex justify-between pt-2">
          <div className="skeleton h-6 w-20" />
          <div className="skeleton h-9 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Зарежда...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="card flex flex-wrap items-center gap-4 p-4" aria-hidden="true">
      <div className="skeleton h-12 w-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-3 w-1/3" />
      </div>
      <div className="skeleton h-8 w-24 rounded-lg" />
    </div>
  );
}

export function SkeletonList({ count = 5 }) {
  return (
    <div className="space-y-3" role="status" aria-label="Зарежда...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Зарежда...">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-3 p-5" aria-hidden="true">
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton h-7 w-2/3" />
        </div>
      ))}
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/context/AuthContext.jsx' <<'AIBT_FILE_END_7f3a'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { tokenStorage, getErrorFeedback } from '../api/axios.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => (tokenStorage.get() ? tokenStorage.getUser() : null));
  const [token, setToken] = useState(() => tokenStorage.get());
  const [checking, setChecking] = useState(() => Boolean(tokenStorage.get()));

  // Refresh the user from the server on startup
  useEffect(() => {
    let cancelled = false;
    const currentToken = tokenStorage.get();
    if (!currentToken) {
      setChecking(false);
      return undefined;
    }
    api
      .get('/auth/me', { skipGlobalHandler: true })
      .then((res) => {
        if (cancelled) return;
        setUser(res.data.data.user);
        tokenStorage.setUser(res.data.data.user);
      })
      .catch((err) => {
        if (cancelled) return;
        if (getErrorFeedback(err).status === 401) {
          tokenStorage.clear();
          setUser(null);
          setToken(null);
        }
      })
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback((data) => {
    tokenStorage.set(data.token);
    tokenStorage.setUser(data.user);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const res = await api.post('/auth/login', credentials);
      applySession(res.data.data);
      return res.data;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const res = await api.post('/auth/register', payload);
      applySession(res.data.data);
      return res.data;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    let message = 'Излезе успешно. Ще се видим скоро!';
    try {
      const res = await api.post('/auth/logout', null, { skipGlobalHandler: true });
      message = res.data.message || message;
    } catch {
      // still log out locally
    }
    clearSession();
    navigate('/', { state: { flash: { type: 'success', message } } });
  }, [clearSession, navigate]);

  // Global 401 → clear session and send to login with the server message
  useEffect(() => {
    const handler = (event) => {
      clearSession();
      if (!event.detail?.redirect) return;
      if (location.pathname.startsWith('/login')) return;
      const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
      navigate(`/login?redirect=${redirect}`, {
        replace: true,
        state: { flash: { type: 'error', message: event.detail?.message || 'Сесията ти изтече. Моля, влез отново.' } },
      });
    };
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, [clearSession, location.pathname, location.search, navigate]);

  const value = useMemo(
    () => ({
      user,
      token,
      checking,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      isStaff: user?.role === 'staff',
      isClient: user?.role === 'client',
      login,
      register,
      logout,
      setUser,
    }),
    [user, token, checking, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/hooks/useDebounce.js' <<'AIBT_FILE_END_7f3a'
import { useEffect, useState } from 'react';

/** Returns `value` only after it stops changing for `delay` ms (search debounce). */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/pages/AdminServices.jsx' <<'AIBT_FILE_END_7f3a'
import { useCallback, useEffect, useState } from 'react';
import api, { getErrorFeedback, getFieldErrors } from '../api/axios.js';
import useDebounce from '../hooks/useDebounce.js';
import CustomDropdown from '../components/CustomDropdown.jsx';
import InlineFeedback from '../components/InlineFeedback.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Modal from '../components/Modal.jsx';
import Pagination from '../components/Pagination.jsx';
import { ServiceImage } from '../components/ServiceCard.jsx';
import { SkeletonList } from '../components/Skeleton.jsx';
import { formatDuration, formatPrice, TIME_OPTIONS, WEEKDAYS_SHORT_BY_INDEX } from '../utils/format.js';

const DURATION_OPTIONS = [15, 20, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300, 360].map((m) => ({ value: m, label: formatDuration(m) }));

const SORT_OPTIONS = [
  { value: 'newest', label: 'Най-нови' },
  { value: 'title_asc', label: 'Име (А → Я)' },
  { value: 'price_asc', label: 'Цена ↑' },
  { value: 'price_desc', label: 'Цена ↓' },
  { value: 'duration_asc', label: 'Времетраене ↑' },
  { value: 'duration_desc', label: 'Времетраене ↓' },
];

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-3">
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </button>
  );
}

function Field({ id, label, error, children, hint }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      {children}
      {error ? <p className="field-error">{error}</p> : hint ? <p className="mt-1.5 text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

/* =========================================================================
 *  SERVICE FORM
 * ========================================================================= */
const EMPTY_SERVICE = { title: '', category: '', price: '', duration: 30, image: '', description: '', isActive: true };

const validateService = (f) => {
  const e = {};
  if (!f.title.trim()) e.title = 'Името на услугата е задължително';
  else if (f.title.trim().length < 2) e.title = 'Името трябва да е поне 2 символа';
  if (!f.category.trim()) e.category = 'Категорията е задължителна';
  if (f.price === '' || Number.isNaN(Number(f.price))) e.price = 'Въведи цена';
  else if (Number(f.price) < 0) e.price = 'Цената не може да е отрицателна';
  if (!f.duration) e.duration = 'Избери продължителност';
  if (f.image && !/^(https?:\/\/|\/)\S+$/i.test(f.image.trim())) e.image = 'Въведи валиден адрес на изображение (http/https)';
  if (f.description.length > 2000) e.description = 'Описанието може да е най-много 2000 символа';
  return e;
};

function ServiceFormModal({ open, service, categories, onClose, onSaved }) {
  const isEdit = Boolean(service);
  const [form, setForm] = useState(EMPTY_SERVICE);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFeedback(null);
    setAiFeedback(null);
    setForm(
      service
        ? {
            title: service.title,
            category: service.category,
            price: String(service.price),
            duration: service.duration,
            image: service.image || '',
            description: service.description || '',
            isActive: service.isActive !== false,
          }
        : EMPTY_SERVICE
    );
  }, [open, service]);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const blur = (name) => {
    const e = validateService(form);
    if (form[name] !== '' && e[name]) setErrors((er) => ({ ...er, [name]: e[name] }));
  };

  const generate = async () => {
    if (form.title.trim().length < 2) {
      setErrors((e) => ({ ...e, title: 'Първо въведи име на услугата' }));
      return;
    }
    setGenerating(true);
    setAiFeedback(null);
    try {
      const res = await api.post('/ai/generate-description', { title: form.title.trim(), category: form.category.trim() || undefined });
      set('description', res.data.data.description);
      setAiFeedback({
        type: 'success',
        message: `${res.data.message}${res.data.data.source === 'mock' ? ' (локален AI – добави OPENAI_API_KEY за още по-добри текстове)' : ''}`,
      });
    } catch (err) {
      const fb = getErrorFeedback(err);
      setAiFeedback({ type: 'error', message: fb.message });
      setErrors((e) => ({ ...e, ...getFieldErrors(fb.errors) }));
    } finally {
      setGenerating(false);
    }
  };

  const submit = async (ev) => {
    ev?.preventDefault();
    const e = validateService(form);
    setErrors(e);
    if (Object.keys(e).length) {
      setFeedback({ type: 'error', message: 'Моля, попълни правилно отбелязаните полета.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      duration: Number(form.duration),
      image: form.image.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
    };
    try {
      const res = isEdit ? await api.put(`/services/${service._id}`, payload) : await api.post('/services', payload);
      onSaved(res.data.message);
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors });
      setErrors(getFieldErrors(fb.errors));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Редактирай услуга' : 'Нова услуга'}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Отказ
          </button>
          <button type="button" className="btn-primary" onClick={submit} disabled={saving || generating}>
            {saving ? 'Зарежда...' : isEdit ? 'Запази промените' : 'Създай услугата'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <InlineFeedback type={feedback?.type} message={feedback?.message} errors={feedback?.errors} onClose={() => setFeedback(null)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="sf-title" label="Име на услугата" error={errors.title}>
            <input id="sf-title" value={form.title} onChange={(e) => set('title', e.target.value)} onBlur={() => blur('title')} maxLength={100} placeholder="Например: Мъжко подстригване" className={`input ${errors.title ? 'input-error' : ''}`} />
          </Field>
          <Field id="sf-category" label="Категория" error={errors.category} hint="Избери съществуваща или напиши нова.">
            <input
              id="sf-category"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              onBlur={() => blur('category')}
              maxLength={50}
              placeholder="Например: Подстригване"
              className={`input ${errors.category ? 'input-error' : ''}`}
            />
            {categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set('category', c)}
                    className={`rounded-full border px-2.5 py-0.5 text-xs ${form.category === c ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field id="sf-price" label="Цена (€)" error={errors.price}>
            <input id="sf-price" type="number" inputMode="decimal" min="0" step="0.5" value={form.price} onChange={(e) => set('price', e.target.value)} onBlur={() => blur('price')} placeholder="15" className={`input ${errors.price ? 'input-error' : ''}`} />
          </Field>
          <CustomDropdown label="Продължителност" options={DURATION_OPTIONS} value={form.duration} onChange={(v) => set('duration', v)} placeholder="Избери" error={errors.duration} searchable={false} />
        </div>

        <Field id="sf-image" label="Снимка (URL)" error={errors.image} hint="По желание. Ако няма снимка, ще се покаже красив цветен фон.">
          <input id="sf-image" value={form.image} onChange={(e) => set('image', e.target.value)} onBlur={() => blur('image')} placeholder="https://..." className={`input ${errors.image ? 'input-error' : ''}`} />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label htmlFor="sf-description" className="label mb-0">
              Описание
            </label>
            <button type="button" onClick={generate} disabled={generating || saving} className="btn-secondary btn-sm border-brand-200 text-brand-700">
              {generating ? 'Зарежда...' : '✨ Генерирай с AI'}
            </button>
          </div>
          <textarea
            id="sf-description"
            rows={5}
            maxLength={2000}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Опиши услугата или натисни „Генерирай с AI“"
            className={`input resize-y ${errors.description ? 'input-error' : ''}`}
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            {errors.description ? <p className="field-error mt-0">{errors.description}</p> : <span />}
            <span>{form.description.length}/2000</span>
          </div>
          {aiFeedback && <InlineFeedback type={aiFeedback.type} message={aiFeedback.message} className="mt-2" onClose={() => setAiFeedback(null)} />}
        </div>

        <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label={form.isActive ? 'Активна – вижда се от клиентите' : 'Неактивна – скрита от клиентите'} />
      </form>
    </Modal>
  );
}

/* =========================================================================
 *  STAFF FORM
 * ========================================================================= */
const EMPTY_STAFF = { name: '', email: '', phone: '', password: '', position: '', bio: '', services: [], workingDays: [1, 2, 3, 4, 5], workStart: '09:00', workEnd: '18:00', isActive: true };

const validateStaff = (f, isEdit) => {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Името трябва да е поне 2 символа';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = 'Въведи валиден имейл адрес';
  if (!isEdit && f.password.length < 6) e.password = 'Паролата трябва да е поне 6 символа';
  if (isEdit && f.password && f.password.length < 6) e.password = 'Паролата трябва да е поне 6 символа';
  if (f.phone.trim() && !/^[+\d\s()-]{6,20}$/.test(f.phone.trim())) e.phone = 'Въведи валиден телефонен номер';
  if (!f.workingDays.length) e.workingDays = 'Избери поне един работен ден';
  if (f.workEnd <= f.workStart) e.workEnd = 'Краят трябва да е след началото';
  return e;
};

function StaffFormModal({ open, member, services, onClose, onSaved }) {
  const isEdit = Boolean(member);
  const [form, setForm] = useState(EMPTY_STAFF);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFeedback(null);
    setForm(
      member
        ? {
            name: member.name,
            email: member.email || '',
            phone: member.phone || '',
            password: '',
            position: member.position || '',
            bio: member.bio || '',
            services: (member.services || []).map((s) => s._id || s),
            workingDays: member.workingDays || [],
            workStart: member.workStart || '09:00',
            workEnd: member.workEnd || '18:00',
            isActive: member.isActive !== false,
          }
        : EMPTY_STAFF
    );
  }, [open, member]);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const toggleIn = (name, value) => set(name, form[name].includes(value) ? form[name].filter((v) => v !== value) : [...form[name], value]);

  const blur = (name) => {
    const e = validateStaff(form, isEdit);
    if (form[name] && e[name]) setErrors((er) => ({ ...er, [name]: e[name] }));
  };

  const submit = async (ev) => {
    ev?.preventDefault();
    const e = validateStaff(form, isEdit);
    setErrors(e);
    if (Object.keys(e).length) {
      setFeedback({ type: 'error', message: 'Моля, попълни правилно отбелязаните полета.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      position: form.position.trim(),
      bio: form.bio.trim(),
      services: form.services,
      workingDays: form.workingDays,
      workStart: form.workStart,
      workEnd: form.workEnd,
      isActive: form.isActive,
    };
    if (form.password) payload.password = form.password;
    try {
      const res = isEdit ? await api.put(`/staff/${member._id}`, payload) : await api.post('/staff', payload);
      onSaved(res.data.message);
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors });
      setErrors(getFieldErrors(fb.errors));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Редактирай служител' : 'Нов служител'}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Отказ
          </button>
          <button type="button" className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Зарежда...' : isEdit ? 'Запази промените' : 'Добави служителя'}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <InlineFeedback type={feedback?.type} message={feedback?.message} errors={feedback?.errors} onClose={() => setFeedback(null)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="st-name" label="Име" error={errors.name}>
            <input id="st-name" value={form.name} onChange={(e) => set('name', e.target.value)} onBlur={() => blur('name')} maxLength={60} className={`input ${errors.name ? 'input-error' : ''}`} placeholder="Георги Петров" />
          </Field>
          <Field id="st-position" label="Позиция" error={errors.position}>
            <input id="st-position" value={form.position} onChange={(e) => set('position', e.target.value)} maxLength={60} className="input" placeholder="Барбър, Стилист..." />
          </Field>
          <Field id="st-email" label="Имейл (за вход)" error={errors.email}>
            <input id="st-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} onBlur={() => blur('email')} className={`input ${errors.email ? 'input-error' : ''}`} placeholder="ime@primer.bg" />
          </Field>
          <Field id="st-phone" label="Телефон" error={errors.phone}>
            <input id="st-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} onBlur={() => blur('phone')} className={`input ${errors.phone ? 'input-error' : ''}`} placeholder="+359..." />
          </Field>
          <Field id="st-password" label={isEdit ? 'Нова парола (по желание)' : 'Парола'} error={errors.password} hint={isEdit ? 'Остави празно, за да не я променяш.' : undefined}>
            <input id="st-password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} onBlur={() => blur('password')} className={`input ${errors.password ? 'input-error' : ''}`} placeholder="Поне 6 символа" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <CustomDropdown label="Начало" options={TIME_OPTIONS} value={form.workStart} onChange={(v) => set('workStart', v || '09:00')} error={errors.workStart} />
            <CustomDropdown label="Край" options={TIME_OPTIONS} value={form.workEnd} onChange={(v) => set('workEnd', v || '18:00')} error={errors.workEnd} />
          </div>
        </div>

        <div>
          <p className="label">Работни дни</p>
          <div className="flex flex-wrap gap-2">
            {WEEK_ORDER.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleIn('workingDays', d)}
                aria-pressed={form.workingDays.includes(d)}
                className={`h-10 w-12 rounded-xl border text-sm font-semibold ${form.workingDays.includes(d) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {WEEKDAYS_SHORT_BY_INDEX[d]}
              </button>
            ))}
          </div>
          {errors.workingDays && <p className="field-error">{errors.workingDays}</p>}
        </div>

        <div>
          <p className="label">Услуги, които предлага</p>
          <p className="mb-2 text-xs text-slate-400">Ако не избереш нищо, служителят предлага всички услуги.</p>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <button
                key={s._id}
                type="button"
                onClick={() => toggleIn('services', s._id)}
                aria-pressed={form.services.includes(s._id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${form.services.includes(s._id) ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                {form.services.includes(s._id) ? '✓ ' : ''}
                {s.title}
              </button>
            ))}
            {services.length === 0 && <p className="text-sm text-slate-400">Все още няма услуги.</p>}
          </div>
          {errors.services && <p className="field-error">{errors.services}</p>}
        </div>

        <Field id="st-bio" label="Кратко описание" error={errors.bio}>
          <textarea id="st-bio" rows={2} maxLength={500} value={form.bio} onChange={(e) => set('bio', e.target.value)} className="input resize-none" placeholder="Опит, специалност..." />
        </Field>

        <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label={form.isActive ? 'Активен – приема резервации' : 'Неактивен – не приема резервации'} />
      </form>
    </Modal>
  );
}

/* =========================================================================
 *  PAGE
 * ========================================================================= */
export default function AdminServices() {
  const [tab, setTab] = useState('services');
  const [feedback, setFeedback] = useState(null);

  // Services state
  const [services, setServices] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [reload, setReload] = useState(0);
  const debouncedSearch = useDebounce(search, 400);

  // Staff state
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState('');
  const [allServices, setAllServices] = useState([]);

  // Modals
  const [serviceModal, setServiceModal] = useState({ open: false, item: null });
  const [staffModal, setStaffModal] = useState({ open: false, item: null });
  const [confirm, setConfirm] = useState(null); // { kind: 'service' | 'staff', item }
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const refresh = useCallback(() => setReload((r) => r + 1), []);

  useEffect(() => setPage(1), [debouncedSearch, category, sort]);

  useEffect(() => {
    api
      .get('/services/categories')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]));
    api
      .get('/services', { params: { limit: 100, sort: 'title_asc', includeInactive: 'true' } })
      .then((res) => setAllServices(res.data.data || []))
      .catch(() => setAllServices([]));
  }, [reload]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setListError('');
    api
      .get('/services', { params: { page, limit: 8, search: debouncedSearch || undefined, category: category || undefined, sort, includeInactive: 'true' } })
      .then((res) => {
        if (cancelled) return;
        setServices(res.data.data || []);
        setMeta(res.data.meta || { totalPages: 1, total: 0 });
      })
      .catch((err) => !cancelled && setListError(getErrorFeedback(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, category, sort, reload]);

  useEffect(() => {
    let cancelled = false;
    setStaffLoading(true);
    setStaffError('');
    api
      .get('/staff', { params: { all: 'true' } })
      .then((res) => !cancelled && setStaff(res.data.data || []))
      .catch((err) => !cancelled && setStaffError(getErrorFeedback(err).message))
      .finally(() => !cancelled && setStaffLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const onSaved = (message) => {
    setServiceModal({ open: false, item: null });
    setStaffModal({ open: false, item: null });
    setFeedback({ type: 'success', message });
    refresh();
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    setConfirmError('');
    try {
      const url = confirm.kind === 'service' ? `/services/${confirm.item._id}` : `/staff/${confirm.item._id}`;
      const res = await api.delete(url);
      setFeedback({ type: 'success', message: res.data.message });
      setConfirm(null);
      if (confirm.kind === 'service' && services.length === 1 && page > 1) setPage((p) => p - 1);
      refresh();
    } catch (err) {
      setConfirmError(getErrorFeedback(err).message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const hasFilters = Boolean(search || category);

  return (
    <div className="container-page py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="section-title">Управление</h1>
          <p className="mt-1 text-slate-500">Добавяй услуги, служители и работно време.</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => (tab === 'services' ? setServiceModal({ open: true, item: null }) : setStaffModal({ open: true, item: null }))}
        >
          {tab === 'services' ? '+ Нова услуга' : '+ Нов служител'}
        </button>
      </div>

      <div className="mt-6 inline-flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Секции">
        {[
          ['services', `Услуги (${meta.total || 0})`],
          ['staff', `Служители (${staff.length})`],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key);
              setFeedback(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === key ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {feedback && <InlineFeedback type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} className="mt-6" />}

      {tab === 'services' && (
        <section className="mt-6" aria-label="Услуги">
          <div className="card grid gap-3 p-4 md:grid-cols-[1fr_200px_200px]">
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Търси услуга..." className="input" aria-label="Търси услуга" />
            <CustomDropdown options={categories.map((c) => ({ value: c, label: c }))} value={category} onChange={setCategory} placeholder="Всички категории" clearable />
            <CustomDropdown options={SORT_OPTIONS} value={sort} onChange={(v) => setSort(v || 'newest')} searchable={false} />
          </div>

          <div className="mt-4">
            {loading && <SkeletonList count={4} />}
            {!loading && listError && (
              <InlineFeedback type="error" message={listError}>
                <button type="button" onClick={refresh} className="mt-2 text-sm font-semibold underline">
                  Опитай отново
                </button>
              </InlineFeedback>
            )}
            {!loading && !listError && services.length === 0 && (
              <EmptyState
                description={hasFilters ? 'Няма услуги по тези критерии.' : 'Добави първата си услуга – отнема по-малко от минута.'}
                actionLabel={hasFilters ? 'Изчисти филтрите' : '+ Нова услуга'}
                onAction={
                  hasFilters
                    ? () => {
                        setSearch('');
                        setCategory('');
                      }
                    : () => setServiceModal({ open: true, item: null })
                }
              />
            )}
            {!loading && !listError && services.length > 0 && (
              <div className="space-y-3">
                {services.map((s) => (
                  <article key={s._id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <ServiceImage service={s} className="h-16 w-full shrink-0 rounded-xl sm:w-24" compact />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{s.title}</h3>
                        <span className="badge bg-slate-100 text-slate-600">{s.category}</span>
                        {!s.isActive && <span className="badge bg-amber-100 text-amber-800">Неактивна</span>}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {formatPrice(s.price)} · {formatDuration(s.duration)}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{s.description || 'Без описание'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="btn-secondary btn-sm" onClick={() => setServiceModal({ open: true, item: s })}>
                        Редактирай
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                        onClick={() => {
                          setConfirmError('');
                          setConfirm({ kind: 'service', item: s });
                        }}
                      >
                        Изтрий
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} disabled={loading} />
          </div>
        </section>
      )}

      {tab === 'staff' && (
        <section className="mt-6" aria-label="Служители">
          {staffLoading && <SkeletonList count={3} />}
          {!staffLoading && staffError && <InlineFeedback type="error" message={staffError} />}
          {!staffLoading && !staffError && staff.length === 0 && (
            <EmptyState description="Добави първия член на екипа, за да могат клиентите да резервират." actionLabel="+ Нов служител" onAction={() => setStaffModal({ open: true, item: null })} />
          )}
          {!staffLoading && !staffError && staff.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {staff.map((m) => (
                <article key={m._id} className="card flex flex-col p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-purple-500 text-lg font-bold text-white">
                      {m.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{m.name}</h3>
                        {!m.isActive && <span className="badge bg-amber-100 text-amber-800">Неактивен</span>}
                      </div>
                      <p className="text-sm text-slate-500">{m.position || 'Служител'}</p>
                      <p className="text-xs text-slate-400">{m.email}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1 text-sm text-slate-600">
                    <p>
                      🕘 {m.workStart} – {m.workEnd} · {WEEK_ORDER.filter((d) => m.workingDays?.includes(d)).map((d) => WEEKDAYS_SHORT_BY_INDEX[d]).join(', ') || 'няма дни'}
                    </p>
                    <p className="line-clamp-2">✂️ {m.services?.length ? m.services.map((s) => s.title).join(', ') : 'Всички услуги'}</p>
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                    <button type="button" className="btn-secondary btn-sm" onClick={() => setStaffModal({ open: true, item: m })}>
                      Редактирай
                    </button>
                    <button
                      type="button"
                      className="btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                      onClick={() => {
                        setConfirmError('');
                        setConfirm({ kind: 'staff', item: m });
                      }}
                    >
                      Изтрий
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <ServiceFormModal open={serviceModal.open} service={serviceModal.item} categories={categories} onClose={() => setServiceModal({ open: false, item: null })} onSaved={onSaved} />
      <StaffFormModal open={staffModal.open} member={staffModal.item} services={allServices} onClose={() => setStaffModal({ open: false, item: null })} onSaved={onSaved} />

      <ConfirmModal
        open={Boolean(confirm)}
        title="Сигурен ли си?"
        message={
          confirm?.kind === 'service'
            ? `Услугата „${confirm?.item?.title}“ ще бъде изтрита завинаги.`
            : `${confirm?.item?.name} ще бъде премахнат(а) от екипа и няма да може да влиза.`
        }
        confirmText="Изтрий"
        cancelText="Отказ"
        loading={confirmLoading}
        error={confirmError}
        onConfirm={handleDelete}
        onCancel={() => !confirmLoading && setConfirm(null)}
      />
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/pages/BookingPage.jsx' <<'AIBT_FILE_END_7f3a'
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getErrorFeedback, getFieldErrors } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import useDebounce from '../hooks/useDebounce.js';
import CustomDropdown from '../components/CustomDropdown.jsx';
import InlineFeedback from '../components/InlineFeedback.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Calendar from '../components/Calendar.jsx';
import ServiceCard, { ServiceImage } from '../components/ServiceCard.jsx';
import { SkeletonGrid } from '../components/Skeleton.jsx';
import { formatDate, formatDuration, formatPrice, parseDateStr, partOfDay } from '../utils/format.js';

const STEPS = ['Избери услуга', 'Избери служител и дата', 'Потвърди'];

function Stepper({ step, onStepClick, canGoTo }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Стъпки на резервацията">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label}>
            <button
              type="button"
              disabled={!canGoTo(n)}
              onClick={() => onStepClick(n)}
              aria-current={active ? 'step' : undefined}
              className={`flex w-full flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center transition sm:flex-row sm:px-4 sm:text-left ${
                active ? 'border-brand-500 bg-brand-50' : done ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'
              } disabled:cursor-not-allowed`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  active ? 'bg-brand-600 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {done ? '✓' : n}
              </span>
              <span className={`text-xs font-semibold sm:text-sm ${active ? 'text-brand-800' : 'text-slate-600'}`}>
                {n}. {label}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export default function BookingPage() {
  const { isAuthenticated, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [serviceId, setServiceId] = useState(searchParams.get('service') || '');
  const [staffId, setStaffId] = useState(searchParams.get('staff') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [time, setTime] = useState(searchParams.get('time') || '');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(() => {
    if (searchParams.get('service') && searchParams.get('staff') && searchParams.get('date') && searchParams.get('time')) return 3;
    if (searchParams.get('service')) return 2;
    return 1;
  });

  // Data
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const debouncedServiceSearch = useDebounce(serviceSearch, 300);

  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');

  const [availability, setAvailability] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsFeedback, setSlotsFeedback] = useState(null);
  const [slotsReload, setSlotsReload] = useState(0);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [created, setCreated] = useState(null);

  const selectedService = useMemo(() => services.find((s) => s._id === serviceId) || null, [services, serviceId]);
  const selectedStaff = useMemo(() => staff.find((s) => s._id === staffId) || null, [staff, staffId]);

  // Keep URL in sync (shareable / survives login redirect)
  useEffect(() => {
    const params = {};
    if (serviceId) params.service = serviceId;
    if (staffId) params.staff = staffId;
    if (date) params.date = date;
    if (time) params.time = time;
    setSearchParams(params, { replace: true });
  }, [serviceId, staffId, date, time, setSearchParams]);

  // Load services
  useEffect(() => {
    let cancelled = false;
    setServicesLoading(true);
    setServicesError('');
    api
      .get('/services', { params: { limit: 100, sort: 'title_asc', search: debouncedServiceSearch || undefined } })
      .then((res) => !cancelled && setServices(res.data.data || []))
      .catch((err) => !cancelled && setServicesError(getErrorFeedback(err).message))
      .finally(() => !cancelled && setServicesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedServiceSearch]);

  // Make sure a pre-selected service (from URL) is known even if filtered out by search
  useEffect(() => {
    if (!serviceId || services.some((s) => s._id === serviceId) || servicesLoading) return;
    api
      .get(`/services/${serviceId}`)
      .then((res) => setServices((prev) => [res.data.data, ...prev]))
      .catch((err) => {
        setFeedback({ type: 'error', message: getErrorFeedback(err).message });
        setServiceId('');
        setStep(1);
      });
  }, [serviceId, services, servicesLoading]);

  // Load staff for the selected service
  useEffect(() => {
    if (!serviceId) {
      setStaff([]);
      return undefined;
    }
    let cancelled = false;
    setStaffLoading(true);
    setStaffError('');
    api
      .get('/staff', { params: { serviceId } })
      .then((res) => {
        if (cancelled) return;
        const list = res.data.data || [];
        setStaff(list);
        if (staffId && !list.some((s) => s._id === staffId)) {
          setStaffId('');
          setTime('');
        }
        if (!staffId && list.length === 1) setStaffId(list[0]._id);
      })
      .catch((err) => !cancelled && setStaffError(getErrorFeedback(err).message))
      .finally(() => !cancelled && setStaffLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  // Load free slots
  useEffect(() => {
    if (!serviceId || !staffId || !date) {
      setAvailability(null);
      setSlotsFeedback(null);
      return undefined;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsFeedback(null);
    api
      .get('/bookings/availability', { params: { serviceId, staffId, date } })
      .then((res) => {
        if (cancelled) return;
        setAvailability(res.data.data);
        const slots = res.data.data?.slots || [];
        setSlotsFeedback({ type: slots.length ? 'success' : 'warning', message: res.data.message });
        if (time && !slots.includes(time)) setTime('');
      })
      .catch((err) => {
        if (cancelled) return;
        setAvailability(null);
        setSlotsFeedback({ type: 'error', message: getErrorFeedback(err).message });
      })
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, staffId, date, slotsReload]);

  const groupedSlots = useMemo(() => {
    const groups = {};
    (availability?.slots || []).forEach((t) => {
      const key = partOfDay(t);
      (groups[key] = groups[key] || []).push(t);
    });
    return groups;
  }, [availability]);

  const canGoTo = (n) => {
    if (created) return false;
    if (n === 1) return true;
    if (n === 2) return Boolean(serviceId);
    return Boolean(serviceId && staffId && date && time);
  };

  const chooseService = (service) => {
    if (service._id !== serviceId) {
      setServiceId(service._id);
      setStaffId('');
      setTime('');
    }
    setFeedback(null);
    setStep(2);
  };

  const submit = async () => {
    setSubmitting(true);
    setFeedback(null);
    setFieldErrors({});
    try {
      const res = await api.post('/bookings', { serviceId, staffId, date, time, notes: notes.trim() || undefined });
      setCreated(res.data.data);
      setFeedback({ type: 'success', message: res.data.message });
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors, status: fb.status });
      setFieldErrors(getFieldErrors(fb.errors));
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    setCreated(null);
    setFeedback(null);
    setServiceId('');
    setStaffId('');
    setDate('');
    setTime('');
    setNotes('');
    setStep(1);
  };

  const redirectBack = encodeURIComponent(`/booking?${new URLSearchParams({ service: serviceId, staff: staffId, date, time }).toString()}`);

  return (
    <div className="container-page py-10">
      <div className="max-w-2xl">
        <h1 className="section-title">Резервирай час</h1>
        <p className="mt-2 text-slate-500">Три лесни стъпки и си готов. Можеш да питаш и AI асистента долу вдясно.</p>
      </div>

      <div className="mt-8">
        <Stepper step={step} onStepClick={setStep} canGoTo={canGoTo} />
      </div>

      {/* STEP 1 – SERVICE */}
      {step === 1 && (
        <section className="mt-8 animate-fade-in" aria-labelledby="step1-title">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h2 id="step1-title" className="text-xl font-bold text-slate-900">
              1. Избери услуга
            </h2>
            <input
              type="search"
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              placeholder="Търси услуга..."
              className="input sm:max-w-xs"
              aria-label="Търси услуга"
            />
          </div>
          {feedback?.type === 'error' && <InlineFeedback type="error" message={feedback.message} className="mt-4" onClose={() => setFeedback(null)} />}
          <div className="mt-6">
            {servicesLoading && <SkeletonGrid count={6} />}
            {!servicesLoading && servicesError && <InlineFeedback type="error" message={servicesError} />}
            {!servicesLoading && !servicesError && services.length === 0 && (
              <EmptyState description={serviceSearch ? 'Няма услуги с това име. Пробвай с друга дума.' : 'Все още няма добавени услуги за резервация.'} actionLabel="Към услугите" actionTo="/services" />
            )}
            {!servicesLoading && !servicesError && services.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s) => (
                  <ServiceCard key={s._id} service={s} onSelect={chooseService} selected={s._id === serviceId} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* STEP 2 – STAFF + DATE + TIME */}
      {step === 2 && (
        <section className="mt-8 grid animate-fade-in gap-6 lg:grid-cols-[1fr_1.2fr]" aria-labelledby="step2-title">
          <div className="card space-y-6 p-6">
            <h2 id="step2-title" className="text-xl font-bold text-slate-900">
              2. Избери служител и дата
            </h2>

            {selectedService && (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                <ServiceImage service={selectedService} className="h-14 w-14 shrink-0 rounded-lg" compact />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{selectedService.title}</p>
                  <p className="text-xs text-slate-500">
                    {formatPrice(selectedService.price)} · {formatDuration(selectedService.duration)}
                  </p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="btn-ghost btn-sm">
                  Смени
                </button>
              </div>
            )}

            {staffError && <InlineFeedback type="error" message={staffError} />}

            <CustomDropdown
              label="Служител"
              options={staff.map((s) => ({ value: s._id, label: s.name, description: s.position || undefined }))}
              value={staffId}
              onChange={(v) => {
                setStaffId(v);
                setTime('');
              }}
              placeholder={staffLoading ? 'Зарежда...' : staff.length ? 'Избери служител' : 'Няма служители за тази услуга'}
              disabled={staffLoading || staff.length === 0}
              error={fieldErrors.staffId}
              searchPlaceholder="Търси служител..."
            />

            {selectedStaff && (
              <p className="-mt-3 text-xs text-slate-500">
                Работно време: {selectedStaff.workStart} – {selectedStaff.workEnd}
              </p>
            )}

            <div>
              <p className="label">Дата</p>
              <div className={`rounded-2xl border p-4 ${!staffId ? 'pointer-events-none opacity-50' : 'border-slate-200'}`} aria-disabled={!staffId}>
                <Calendar
                  value={date}
                  onChange={(d) => {
                    setDate(d);
                    setTime('');
                  }}
                  isDateDisabled={(d) => (selectedStaff ? !selectedStaff.workingDays?.includes(parseDateStr(d).getDay()) : true)}
                />
              </div>
              {!staffId && <p className="mt-2 text-xs text-slate-500">Първо избери служител.</p>}
              {fieldErrors.date && <p className="field-error">{fieldErrors.date}</p>}
            </div>
          </div>

          <div className="card flex flex-col p-6">
            <h3 className="text-lg font-bold text-slate-900">Свободни часове</h3>
            <p className="text-sm text-slate-500">{date ? formatDate(date) : 'Избери дата от календара'}</p>

            <div className="mt-5 flex-1">
              {slotsLoading && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="status" aria-label="Зарежда...">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 rounded-xl" />
                  ))}
                </div>
              )}

              {!slotsLoading && slotsFeedback && slotsFeedback.type !== 'success' && (
                <InlineFeedback type={slotsFeedback.type} message={slotsFeedback.message} />
              )}

              {!slotsLoading && !date && (
                <div className="flex h-full min-h-[12rem] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
                  Избери служител и дата, за да видиш свободните часове.
                </div>
              )}

              {!slotsLoading &&
                Object.entries(groupedSlots).map(([group, slots]) => (
                  <div key={group} className="mb-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group}</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTime(t)}
                          aria-pressed={time === t}
                          className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                            time === t ? 'border-brand-600 bg-brand-600 text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              {fieldErrors.time && <p className="field-error">{fieldErrors.time}</p>}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                ← Назад
              </button>
              <button type="button" onClick={() => setStep(3)} disabled={!time} className="btn-primary">
                Напред →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* STEP 3 – CONFIRM */}
      {step === 3 && (
        <section className="mx-auto mt-8 max-w-2xl animate-fade-in" aria-labelledby="step3-title">
          <div className="card p-6 sm:p-8">
            <h2 id="step3-title" className="text-xl font-bold text-slate-900">
              {created ? 'Резервацията е готова 🎉' : '3. Потвърди резервацията'}
            </h2>

            <dl className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
              {[
                ['Услуга', selectedService?.title || created?.serviceTitle || '—'],
                ['Служител', selectedStaff?.name || created?.staffName || '—'],
                ['Дата', date ? formatDate(date) : '—'],
                ['Час', time || '—'],
                ['Продължителност', selectedService ? formatDuration(selectedService.duration) : '—'],
                ['Цена', selectedService ? formatPrice(selectedService.price) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-semibold text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>

            {feedback && <InlineFeedback type={feedback.type} message={feedback.message} errors={feedback.errors} className="mt-6" />}

            {created ? (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link to="/dashboard" className="btn-primary flex-1">
                  Към моите резервации
                </Link>
                <button type="button" onClick={startOver} className="btn-secondary flex-1">
                  Нова резервация
                </button>
              </div>
            ) : !isAuthenticated ? (
              <div className="mt-6">
                <InlineFeedback type="info" message="Почти готово! Влез или се регистрирай, за да потвърдиш резервацията. Изборът ти ще бъде запазен." />
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link to={`/login?redirect=${redirectBack}`} className="btn-primary flex-1">
                    Вход
                  </Link>
                  <Link to={`/register?redirect=${redirectBack}`} className="btn-secondary flex-1">
                    Регистрация
                  </Link>
                </div>
                <button type="button" onClick={() => setStep(2)} className="btn-ghost mt-3 w-full">
                  ← Назад
                </button>
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <label htmlFor="notes" className="label">
                    Бележка към салона (по желание)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      if (fieldErrors.notes) setFieldErrors((f) => ({ ...f, notes: '' }));
                    }}
                    maxLength={500}
                    rows={3}
                    placeholder="Например: искам по-късо отстрани"
                    className={`input resize-none ${fieldErrors.notes ? 'input-error' : ''}`}
                    disabled={submitting}
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-400">
                    {fieldErrors.notes ? <p className="field-error mt-0">{fieldErrors.notes}</p> : <span>Резервираш като {user?.name}</span>}
                    <span>{notes.length}/500</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => setStep(2)} className="btn-secondary" disabled={submitting}>
                    ← {feedback?.status === 409 ? 'Избери друг час' : 'Назад'}
                  </button>
                  <button type="button" onClick={feedback?.status === 409 ? () => { setSlotsReload((k) => k + 1); setTime(''); setFeedback(null); setStep(2); } : submit} className="btn-primary" disabled={submitting || !time}>
                    {submitting ? 'Зарежда...' : feedback?.status === 409 ? 'Виж свободните часове' : 'Потвърди резервацията'}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/pages/Dashboard.jsx' <<'AIBT_FILE_END_7f3a'
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorFeedback, getFieldErrors } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import useDebounce from '../hooks/useDebounce.js';
import CustomDropdown from '../components/CustomDropdown.jsx';
import InlineFeedback from '../components/InlineFeedback.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import Modal from '../components/Modal.jsx';
import Pagination from '../components/Pagination.jsx';
import { SkeletonList, SkeletonStats } from '../components/Skeleton.jsx';
import { BOOKING_STATUS, formatDate, formatDuration, formatPrice, todayStr, ROLE_LABELS } from '../utils/format.js';

const STATUS_FILTER = [
  { value: 'pending', label: 'Чакащи' },
  { value: 'confirmed', label: 'Потвърдени' },
  { value: 'completed', label: 'Завършени' },
  { value: 'cancelled', label: 'Отказани' },
];

const SCOPE_OPTIONS = [
  { value: 'all', label: 'Всички дати' },
  { value: 'upcoming', label: 'Предстоящи' },
  { value: 'past', label: 'Минали' },
];

const isFuture = (b) => new Date(b.startAt) > new Date();

/* ------------------------------------------------------------------ */
function StatCard({ label, value, hint, icon, accent = 'from-brand-500 to-purple-500' }) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${accent} opacity-15`} aria-hidden="true" />
      <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <span aria-hidden="true">{icon}</span> {label}
      </p>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = BOOKING_STATUS[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
  return <span className={`badge ${s.className}`}>{s.label}</span>;
}

/* ------------------------------------------------------------------ */
function BookingRow({ booking, role, onStatus, onEdit, onDelete, busyId }) {
  const busy = busyId === booking._id;
  const future = isFuture(booking);
  const actions = [];

  if (role === 'client') {
    if (['pending', 'confirmed'].includes(booking.status) && future) {
      actions.push({ key: 'cancel', label: 'Откажи', className: 'btn-secondary btn-sm text-rose-600', onClick: () => onStatus(booking, 'cancelled', true) });
    }
  } else {
    if (booking.status === 'pending') {
      actions.push({ key: 'confirm', label: 'Потвърди', className: 'btn-success btn-sm', onClick: () => onStatus(booking, 'confirmed') });
    }
    if (['pending', 'confirmed'].includes(booking.status) && !future) {
      actions.push({ key: 'complete', label: 'Завърши', className: 'btn-primary btn-sm', onClick: () => onStatus(booking, 'completed') });
    }
    if (['pending', 'confirmed'].includes(booking.status)) {
      actions.push({ key: 'cancel', label: 'Откажи', className: 'btn-secondary btn-sm text-rose-600', onClick: () => onStatus(booking, 'cancelled', true) });
    }
    if (role === 'admin' && booking.status === 'cancelled' && future) {
      actions.push({ key: 'restore', label: 'Възстанови', className: 'btn-secondary btn-sm', onClick: () => onStatus(booking, 'pending') });
    }
    if (role === 'admin') {
      actions.push({ key: 'edit', label: 'Редактирай', className: 'btn-secondary btn-sm', onClick: () => onEdit(booking) });
      actions.push({ key: 'delete', label: 'Изтрий', className: 'btn-ghost btn-sm text-rose-600 hover:bg-rose-50', onClick: () => onDelete(booking) });
    }
  }

  return (
    <article className={`card flex flex-col gap-4 p-4 transition sm:flex-row sm:items-center ${busy ? 'opacity-60' : ''}`}>
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <span className="text-lg font-extrabold leading-none">{booking.date?.slice(8)}</span>
        <span className="text-[10px] font-semibold uppercase">{formatDate(booking.date, { withWeekday: false }).split(' ')[1]?.slice(0, 3)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-slate-900">{booking.service?.title || booking.serviceTitle}</h3>
          <StatusBadge status={booking.status} />
        </div>
        <p className="mt-0.5 text-sm text-slate-500">
          {formatDate(booking.date)} · {booking.time}–{booking.endTime} · {formatDuration(booking.duration)} · {formatPrice(booking.price)}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">
          {role !== 'staff' && <>👤 {booking.staff?.name || booking.staffName}</>}
          {role !== 'client' && (
            <>
              {role !== 'staff' && ' · '}🙋 {booking.clientName}
              {booking.clientPhone && <span className="text-slate-400"> ({booking.clientPhone})</span>}
            </>
          )}
        </p>
        {booking.notes && <p className="mt-1 line-clamp-2 text-xs italic text-slate-400">„{booking.notes}“</p>}
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {actions.map((a) => (
            <button key={a.key} type="button" onClick={a.onClick} disabled={busy} className={a.className}>
              {busy && a.key !== 'edit' && a.key !== 'delete' ? 'Зарежда...' : a.label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
const EMPTY_FORM = { serviceId: '', staffId: '', date: '', time: '', clientName: '', clientPhone: '', clientEmail: '', notes: '', status: 'confirmed' };

function BookingFormModal({ open, booking, onClose, onSaved }) {
  const isEdit = Boolean(booking);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotsMsg, setSlotsMsg] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFeedback(null);
    setForm(
      booking
        ? {
            serviceId: booking.service?._id || booking.service || '',
            staffId: booking.staff?._id || booking.staff || '',
            date: booking.date,
            time: booking.time,
            clientName: booking.clientName || '',
            clientPhone: booking.clientPhone || '',
            clientEmail: booking.clientEmail || '',
            notes: booking.notes || '',
            status: booking.status,
          }
        : EMPTY_FORM
    );
    api
      .get('/services', { params: { limit: 100, sort: 'title_asc' } })
      .then((res) => setServices(res.data.data || []))
      .catch((err) => setFeedback({ type: 'error', message: getErrorFeedback(err).message }));
  }, [open, booking]);

  useEffect(() => {
    if (!open || !form.serviceId) {
      setStaff([]);
      return;
    }
    api
      .get('/staff', { params: { serviceId: form.serviceId } })
      .then((res) => setStaff(res.data.data || []))
      .catch((err) => setFeedback({ type: 'error', message: getErrorFeedback(err).message }));
  }, [open, form.serviceId]);

  useEffect(() => {
    if (!open || !form.serviceId || !form.staffId || !form.date) {
      setSlots([]);
      setSlotsMsg('');
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    api
      .get('/bookings/availability', { params: { serviceId: form.serviceId, staffId: form.staffId, date: form.date, excludeId: booking?._id } })
      .then((res) => {
        if (cancelled) return;
        let list = res.data.data?.slots || [];
        // Keep the current time selectable when editing without schedule changes
        if (booking && form.date === booking.date && form.staffId === (booking.staff?._id || booking.staff) && !list.includes(booking.time)) {
          list = [...list, booking.time].sort();
        }
        setSlots(list);
        setSlotsMsg(list.length ? '' : res.data.message);
      })
      .catch((err) => !cancelled && setSlotsMsg(getErrorFeedback(err).message))
      .finally(() => !cancelled && setSlotsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, form.serviceId, form.staffId, form.date, booking]);

  const set = (name, value) => {
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === 'serviceId') {
        next.staffId = '';
        next.time = '';
      }
      if (name === 'staffId' || name === 'date') next.time = '';
      return next;
    });
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.serviceId) e.serviceId = 'Избери услуга';
    if (!form.staffId) e.staffId = 'Избери служител';
    if (!form.date) e.date = 'Избери дата';
    if (!form.time) e.time = 'Избери час';
    if (!isEdit && form.clientName.trim().length < 2) e.clientName = 'Въведи име на клиента (поне 2 символа)';
    if (form.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.clientEmail.trim())) e.clientEmail = 'Въведи валиден имейл адрес';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev?.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setFeedback({ type: 'error', message: 'Моля, попълни правилно отбелязаните полета.' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    const payload = {
      serviceId: form.serviceId,
      staffId: form.staffId,
      date: form.date,
      time: form.time,
      notes: form.notes.trim(),
      status: form.status,
    };
    const isWalkIn = !isEdit || !booking.client;
    if (isWalkIn) {
      payload.clientName = form.clientName.trim() || undefined;
      payload.clientPhone = form.clientPhone.trim() || undefined;
      payload.clientEmail = form.clientEmail.trim() || undefined;
    }
    try {
      const res = isEdit ? await api.put(`/bookings/${booking._id}`, payload) : await api.post('/bookings', payload);
      onSaved(res.data.message);
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors });
      setErrors(getFieldErrors(fb.errors));
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = isEdit
    ? Object.entries(BOOKING_STATUS).map(([value, s]) => ({ value, label: s.label }))
    : [
        { value: 'confirmed', label: 'Потвърдена' },
        { value: 'pending', label: 'Чакаща' },
      ];

  const clientEditable = !isEdit || !booking?.client;

  return (
    <Modal
      open={open}
      title={isEdit ? 'Редактирай резервация' : 'Нова резервация'}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Отказ
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Зарежда...' : isEdit ? 'Запази промените' : 'Създай резервация'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <InlineFeedback type={feedback?.type} message={feedback?.message} errors={feedback?.errors} onClose={() => setFeedback(null)} />

        <div className="grid gap-4 sm:grid-cols-2">
          <CustomDropdown
            label="Услуга"
            options={services.map((s) => ({ value: s._id, label: s.title, description: `${formatPrice(s.price)} · ${formatDuration(s.duration)}` }))}
            value={form.serviceId}
            onChange={(v) => set('serviceId', v)}
            placeholder="Избери услуга"
            error={errors.serviceId}
          />
          <CustomDropdown
            label="Служител"
            options={staff.map((s) => ({ value: s._id, label: s.name, description: s.position || undefined }))}
            value={form.staffId}
            onChange={(v) => set('staffId', v)}
            placeholder={form.serviceId ? (staff.length ? 'Избери служител' : 'Няма служители') : 'Първо избери услуга'}
            disabled={!form.serviceId || staff.length === 0}
            error={errors.staffId}
          />
          <div>
            <label htmlFor="bf-date" className="label">
              Дата
            </label>
            <input
              id="bf-date"
              type="date"
              min={isEdit ? undefined : todayStr()}
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className={`input ${errors.date ? 'input-error' : ''}`}
            />
            {errors.date && <p className="field-error">{errors.date}</p>}
          </div>
          <div>
            <CustomDropdown
              label="Час"
              options={slots.map((t) => ({ value: t, label: t }))}
              value={form.time}
              onChange={(v) => set('time', v)}
              placeholder={slotsLoading ? 'Зарежда...' : form.date ? (slots.length ? 'Избери час' : 'Няма свободни часове') : 'Първо избери дата'}
              disabled={slotsLoading || !slots.length}
              error={errors.time}
            />
            {slotsMsg && !errors.time && <p className="mt-1.5 text-xs text-amber-600">{slotsMsg}</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">Клиент</p>
          {clientEditable ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="bf-name" className="label">
                  Име
                </label>
                <input id="bf-name" value={form.clientName} onChange={(e) => set('clientName', e.target.value)} className={`input ${errors.clientName ? 'input-error' : ''}`} placeholder="Иван Иванов" maxLength={60} />
                {errors.clientName && <p className="field-error">{errors.clientName}</p>}
              </div>
              <div>
                <label htmlFor="bf-phone" className="label">
                  Телефон
                </label>
                <input id="bf-phone" value={form.clientPhone} onChange={(e) => set('clientPhone', e.target.value)} className={`input ${errors.clientPhone ? 'input-error' : ''}`} placeholder="+359..." />
                {errors.clientPhone && <p className="field-error">{errors.clientPhone}</p>}
              </div>
              <div>
                <label htmlFor="bf-email" className="label">
                  Имейл
                </label>
                <input id="bf-email" type="email" value={form.clientEmail} onChange={(e) => set('clientEmail', e.target.value)} className={`input ${errors.clientEmail ? 'input-error' : ''}`} placeholder="по желание" />
                {errors.clientEmail && <p className="field-error">{errors.clientEmail}</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              {booking.clientName} · {booking.clientEmail} {booking.clientPhone && `· ${booking.clientPhone}`}
              <span className="mt-1 block text-xs text-slate-400">Регистриран клиент – данните се управляват от самия него.</span>
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <div>
            <label htmlFor="bf-notes" className="label">
              Бележка
            </label>
            <textarea id="bf-notes" rows={2} maxLength={500} value={form.notes} onChange={(e) => set('notes', e.target.value)} className={`input resize-none ${errors.notes ? 'input-error' : ''}`} />
            {errors.notes && <p className="field-error">{errors.notes}</p>}
          </div>
          <CustomDropdown label="Статус" options={statusOptions} value={form.status} onChange={(v) => set('status', v || 'confirmed')} searchable={false} error={errors.status} />
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || 'client';
  const isManager = role === 'admin' || role === 'staff';

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(isManager);
  const [statsError, setStatsError] = useState('');

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [scope, setScope] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const debouncedSearch = useDebounce(search, 400);

  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type: 'cancel' | 'delete', booking }
  const [confirmError, setConfirmError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const refresh = useCallback(() => setReload((r) => r + 1), []);

  // Stats
  useEffect(() => {
    if (!isManager) return;
    setStatsLoading(true);
    setStatsError('');
    api
      .get('/bookings/stats')
      .then((res) => setStats(res.data.data))
      .catch((err) => setStatsError(getErrorFeedback(err).message))
      .finally(() => setStatsLoading(false));
  }, [isManager, reload]);

  useEffect(() => setPage(1), [debouncedSearch, status, scope]);

  // List
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setListError('');
    api
      .get('/bookings', {
        params: { page, limit: 8, search: debouncedSearch || undefined, status: status || undefined, scope: scope === 'all' ? undefined : scope },
      })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.data || []);
        setMeta(res.data.meta || { totalPages: 1, total: 0 });
      })
      .catch((err) => !cancelled && setListError(getErrorFeedback(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, status, scope, reload]);

  const changeStatus = async (booking, nextStatus) => {
    setBusyId(booking._id);
    setFeedback(null);
    try {
      const res = await api.patch(`/bookings/${booking._id}/status`, { status: nextStatus });
      setFeedback({ type: 'success', message: res.data.message });
      refresh();
      return true;
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors });
      return fb.message;
    } finally {
      setBusyId(null);
    }
  };

  const handleStatus = (booking, nextStatus, needsConfirm = false) => {
    if (needsConfirm) {
      setConfirmError('');
      setConfirm({ type: 'cancel', booking });
      return;
    }
    changeStatus(booking, nextStatus);
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    setConfirmError('');
    if (confirm.type === 'cancel') {
      const result = await changeStatus(confirm.booking, 'cancelled');
      setConfirmLoading(false);
      if (result === true) setConfirm(null);
      else setConfirmError(result);
      return;
    }
    try {
      const res = await api.delete(`/bookings/${confirm.booking._id}`);
      setFeedback({ type: 'success', message: res.data.message });
      setConfirm(null);
      if (items.length === 1 && page > 1) setPage((p) => p - 1);
      refresh();
    } catch (err) {
      setConfirmError(getErrorFeedback(err).message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (booking) => {
    setEditing(booking);
    setFormOpen(true);
  };

  const onSaved = (message) => {
    setFormOpen(false);
    setEditing(null);
    setFeedback({ type: 'success', message });
    refresh();
  };

  const hasFilters = Boolean(search || status || scope !== 'upcoming');

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Предстоящи', value: stats.upcomingCount, hint: `${stats.pendingCount} чакат потвърждение`, icon: '📅' },
      { label: 'Приходи', value: formatPrice(stats.revenue), hint: `${formatPrice(stats.revenueThisMonth)} този месец`, icon: '💶', accent: 'from-emerald-500 to-teal-500' },
      { label: 'Очаквани приходи', value: formatPrice(stats.expectedRevenue), hint: 'от предстоящите часове', icon: '📈', accent: 'from-sky-500 to-indigo-500' },
      { label: 'Клиенти', value: stats.totalClients, hint: `${stats.totalBookings} резервации общо`, icon: '👥', accent: 'from-amber-500 to-pink-500' },
    ];
  }, [stats]);

  return (
    <div className="container-page py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand-600">{ROLE_LABELS[role]}</p>
          <h1 className="section-title">Здравей, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-slate-500">
            {role === 'admin' && 'Ето как върви бизнесът днес.'}
            {role === 'staff' && 'Ето твоите часове.'}
            {role === 'client' && 'Тук са всички твои резервации.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {role === 'admin' && (
            <>
              <Link to="/admin/services" className="btn-secondary">
                Услуги и екип
              </Link>
              <button type="button" onClick={openCreate} className="btn-primary">
                + Нова резервация
              </button>
            </>
          )}
          {role !== 'admin' && (
            <Link to="/booking" className="btn-primary">
              + Нова резервация
            </Link>
          )}
        </div>
      </div>

      {/* STATS */}
      {isManager && (
        <section className="mt-8" aria-label="Статистика">
          {statsLoading && !stats && <SkeletonStats />}
          {statsError && <InlineFeedback type="error" message={statsError} />}
          {stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((c) => (
                <StatCard key={c.label} {...c} />
              ))}
            </div>
          )}

          {stats && (
            <div className="card mt-6 p-5">
              <h2 className="font-bold text-slate-900">Следващи часове</h2>
              {stats.upcoming.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Няма предстоящи часове. Време е за малко почивка ☕</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {stats.upcoming.map((b) => (
                    <li key={b._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                      <span className="font-semibold text-slate-800">
                        {formatDate(b.date)} · {b.time}
                      </span>
                      <span className="text-slate-500">
                        {b.serviceTitle} · {b.clientName} {role === 'admin' && `· ${b.staffName}`}
                      </span>
                      <StatusBadge status={b.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {/* LIST */}
      <section className="mt-10" aria-labelledby="bookings-title">
        <h2 id="bookings-title" className="text-xl font-bold text-slate-900">
          {role === 'client' ? 'Моите резервации' : 'Резервации'}
        </h2>

        <div className="card mt-4 grid gap-3 p-4 md:grid-cols-[1fr_200px_200px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={role === 'client' ? 'Търси по услуга или служител...' : 'Търси по клиент, телефон, услуга...'}
            className="input"
            aria-label="Търси резервации"
          />
          <CustomDropdown options={STATUS_FILTER} value={status} onChange={setStatus} placeholder="Всички статуси" clearable searchable={false} />
          <CustomDropdown options={SCOPE_OPTIONS} value={scope} onChange={(v) => setScope(v || 'all')} searchable={false} />
        </div>

        {feedback && <InlineFeedback type={feedback.type} message={feedback.message} errors={feedback.errors} onClose={() => setFeedback(null)} className="mt-4" />}

        <div className="mt-4">
          {loading && <SkeletonList count={4} />}
          {!loading && listError && (
            <InlineFeedback type="error" message={listError}>
              <button type="button" onClick={refresh} className="mt-2 text-sm font-semibold underline">
                Опитай отново
              </button>
            </InlineFeedback>
          )}
          {!loading && !listError && items.length === 0 && (
            <EmptyState
              description={hasFilters ? 'Няма резервации по тези критерии.' : 'Тук ще се появят резервациите.'}
              actionLabel={hasFilters ? 'Изчисти филтрите' : 'Запази час'}
              onAction={
                hasFilters
                  ? () => {
                      setSearch('');
                      setStatus('');
                      setScope('upcoming');
                    }
                  : undefined
              }
              actionTo={hasFilters ? undefined : '/booking'}
            />
          )}
          {!loading && !listError && items.length > 0 && (
            <div className="space-y-3">
              {items.map((b) => (
                <BookingRow
                  key={b._id}
                  booking={b}
                  role={role}
                  busyId={busyId}
                  onStatus={handleStatus}
                  onEdit={openEdit}
                  onDelete={(booking) => {
                    setConfirmError('');
                    setConfirm({ type: 'delete', booking });
                  }}
                />
              ))}
            </div>
          )}
          <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} disabled={loading} />
        </div>
      </section>

      <ConfirmModal
        open={Boolean(confirm)}
        title="Сигурен ли си?"
        message={
          confirm?.type === 'delete'
            ? `Резервацията на ${confirm?.booking?.clientName} за ${formatDate(confirm?.booking?.date)} ще бъде изтрита завинаги.`
            : `Резервацията за „${confirm?.booking?.serviceTitle}“ на ${formatDate(confirm?.booking?.date)} в ${confirm?.booking?.time} ще бъде отказана.`
        }
        confirmText={confirm?.type === 'delete' ? 'Изтрий' : 'Да, откажи'}
        cancelText="Отказ"
        loading={confirmLoading}
        error={confirmError}
        onConfirm={handleConfirm}
        onCancel={() => !confirmLoading && setConfirm(null)}
      />

      {role === 'admin' && (
        <BookingFormModal
          open={formOpen}
          booking={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/pages/Home.jsx' <<'AIBT_FILE_END_7f3a'
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorFeedback } from '../api/axios.js';
import ServiceCard from '../components/ServiceCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import InlineFeedback from '../components/InlineFeedback.jsx';
import { SkeletonGrid } from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  { icon: '📅', title: 'Онлайн календар 24/7', text: 'Клиентите виждат реалните свободни часове и резервират за секунди – денем и нощем.' },
  { icon: '🤖', title: 'AI асистент', text: 'Напиши „искам час в петък следобед“ и асистентът ще ти предложи свободни часове.' },
  { icon: '⚡', title: 'Без двойни резервации', text: 'Системата пази всеки час и не позволява два клиента в едно и също време.' },
  { icon: '📊', title: 'Табло за собственика', text: 'Предстоящи часове, приходи и клиенти – всичко на едно място.' },
];

const BUSINESSES = ['💈 Бръснарници', '💇 Фризьорски салони', '🚗 Автомивки', '💅 Студиа за красота', '📸 Фото студиа'];

const STEPS = [
  { n: '1', title: 'Избери услуга', text: 'Разгледай услугите, цените и продължителността.' },
  { n: '2', title: 'Избери служител и час', text: 'Виж свободните часове в календара и избери удобен.' },
  { n: '3', title: 'Потвърди', text: 'Готово! Резервацията се появява в таблото ти.' },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .get('/services', { params: { limit: 6, sort: 'newest' } })
      .then((res) => setServices(res.data.data || []))
      .catch((err) => setError(getErrorFeedback(err).message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-purple-50" />
        <div className="absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 -z-10 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl" />
        <div className="container-page grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <span className="badge bg-brand-100 text-brand-700">✨ Резервации с изкуствен интелект</span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Запази час за секунди. <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent">Без обаждания.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Избери услуга, служител и удобен час от календара – или просто кажи на AI асистента кога ти е удобно.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/booking" className="btn-primary px-6 py-3 text-base">
                Резервирай сега
              </Link>
              <Link to="/services" className="btn-secondary px-6 py-3 text-base">
                Разгледай услугите
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {BUSINESSES.map((b) => (
                <span key={b} className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600">
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="card rotate-1 p-6">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-900">Свободни часове – петък</p>
                <span className="badge bg-emerald-100 text-emerald-700">● Онлайн</span>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2">
                {['09:00', '09:30', '10:30', '11:00', '13:00', '14:30', '15:00', '16:30'].map((t, i) => (
                  <span key={t} className={`rounded-xl py-2 text-center text-sm font-semibold ${i === 5 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 p-4 text-sm text-white">
                🤖 „Намерих свободен час в петък от 14:30 при Георги. Да го запазя ли?“
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-title">Всичко, от което бизнесът ти има нужда</h2>
          <p className="mt-3 text-slate-500">Създадено за малки бизнеси, които искат повече клиенти и по-малко телефонни разговори.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 transition hover:-translate-y-0.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-2xl">{f.icon}</div>
              <h3 className="mt-4 font-bold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR SERVICES */}
      <section className="container-page py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="section-title">Популярни услуги</h2>
            <p className="mt-2 text-slate-500">Избери услуга и запази час директно онлайн.</p>
          </div>
          <Link to="/services" className="btn-secondary">
            Виж всички →
          </Link>
        </div>

        <div className="mt-8">
          {loading && <SkeletonGrid count={3} />}
          {!loading && error && (
            <InlineFeedback type="error" message={error}>
              <button type="button" onClick={load} className="mt-2 text-sm font-semibold underline">
                Опитай отново
              </button>
            </InlineFeedback>
          )}
          {!loading && !error && services.length === 0 && (
            <EmptyState description="Все още няма добавени услуги. Влез като администратор, за да добавиш първата." actionLabel="Към управлението" actionTo="/admin/services" />
          )}
          {!loading && !error && services.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <ServiceCard key={s._id} service={s} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-page py-16">
        <h2 className="section-title text-center">Как работи?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="card relative p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-bold text-white">{s.n}</span>
              <h3 className="mt-4 font-bold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-purple-600 px-6 py-12 text-center text-white shadow-xl sm:px-12">
          <h2 className="text-3xl font-extrabold tracking-tight">Готов ли си за следващия си час?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">Регистрацията отнема под минута. Резервацията – още по-малко.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/booking" className="btn bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50">
              Резервирай час
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">
                Създай профил
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/pages/Login.jsx' <<'AIBT_FILE_END_7f3a'
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorFeedback, getFieldErrors } from '../api/axios.js';
import InlineFeedback from '../components/InlineFeedback.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { isValidEmail } from '../utils/format.js';

const validateField = (name, value) => {
  if (name === 'email') {
    if (!value.trim()) return 'Имейлът е задължителен';
    if (!isValidEmail(value)) return 'Въведи валиден имейл адрес';
  }
  if (name === 'password') {
    if (!value) return 'Паролата е задължителна';
    if (value.length < 6) return 'Паролата трябва да е поне 6 символа';
  }
  return '';
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
    if (feedback?.type === 'error') setFeedback(null);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (value) setErrors((er) => ({ ...er, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = { email: validateField('email', form.email), password: validateField('password', form.password) };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setFeedback({ type: 'error', message: 'Моля, попълни правилно отбелязаните полета.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const data = await login({ email: form.email.trim(), password: form.password });
      const target = redirect && redirect.startsWith('/') ? redirect : '/dashboard';
      navigate(target, { replace: true, state: { flash: { type: 'success', message: data.message } } });
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors });
      setErrors(getFieldErrors(fb.errors));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex min-h-[75vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Добре дошъл отново 👋</h1>
          <p className="mt-1 text-sm text-slate-500">Влез в профила си, за да управляваш резервациите си.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <InlineFeedback type={feedback?.type} message={feedback?.message} errors={feedback?.errors} onClose={() => setFeedback(null)} />

          <div>
            <label htmlFor="email" className="label">
              Имейл
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="ime@primer.bg"
              autoComplete="email"
              disabled={loading}
              aria-invalid={Boolean(errors.email)}
              className={`input ${errors.email ? 'input-error' : ''}`}
            />
            {errors.email && <p id="email-error" className="field-error">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="label">
              Парола
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Поне 6 символа"
              error={errors.password}
              disabled={loading}
            />
            {errors.password && <p id="password-error" className="field-error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Зарежда...' : 'Вход'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Нямаш профил?{' '}
          <Link to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-brand-600 hover:underline">
            Регистрирай се
          </Link>
        </p>

        <div className="mt-6 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">
          Демо администратор: <span className="font-mono font-semibold">admin@test.com</span> / <span className="font-mono font-semibold">123456</span>
        </div>
      </div>
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/pages/NotFound.jsx' <<'AIBT_FILE_END_7f3a'
import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <section className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="relative w-full max-w-xl text-center">
        <div className="absolute inset-x-0 top-6 -z-10 mx-auto h-48 w-48 rounded-full bg-brand-200/50 blur-3xl" aria-hidden="true" />
        <p className="bg-gradient-to-br from-brand-600 via-purple-600 to-pink-500 bg-clip-text text-[8rem] font-black leading-none tracking-tighter text-transparent sm:text-[11rem]">
          404
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">Опа! Тази страница не съществува</h1>
        <p className="mx-auto mt-3 max-w-md text-slate-500">Може би си сбъркал адреса или страницата е преместена.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn-primary px-6 py-3">
            Към началото
          </Link>
          <button type="button" onClick={goBack} className="btn-secondary px-6 py-3">
            Назад
          </button>
        </div>
      </div>
    </section>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/pages/Register.jsx' <<'AIBT_FILE_END_7f3a'
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorFeedback, getFieldErrors } from '../api/axios.js';
import InlineFeedback from '../components/InlineFeedback.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { isValidEmail } from '../utils/format.js';

const PHONE_REGEX = /^[+\d\s()-]{6,20}$/;

const validateField = (name, value, form) => {
  switch (name) {
    case 'name':
      if (!value.trim()) return 'Името е задължително';
      if (value.trim().length < 2) return 'Името трябва да е поне 2 символа';
      if (value.trim().length > 60) return 'Името може да е най-много 60 символа';
      return '';
    case 'email':
      if (!value.trim()) return 'Имейлът е задължителен';
      return isValidEmail(value) ? '' : 'Въведи валиден имейл адрес';
    case 'phone':
      return value.trim() && !PHONE_REGEX.test(value.trim()) ? 'Въведи валиден телефонен номер' : '';
    case 'password':
      if (!value) return 'Паролата е задължителна';
      return value.length < 6 ? 'Паролата трябва да е поне 6 символа' : '';
    case 'confirmPassword':
      if (!value) return 'Повтори паролата';
      return value !== form.password ? 'Паролите не съвпадат' : '';
    default:
      return '';
  }
};

const FIELDS = ['name', 'email', 'phone', 'password', 'confirmPassword'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
    if (feedback?.type === 'error') setFeedback(null);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (value) setErrors((er) => ({ ...er, [name]: validateField(name, value, form) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = Object.fromEntries(FIELDS.map((f) => [f, validateField(f, form[f], form)]));
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setFeedback({ type: 'error', message: 'Моля, попълни правилно отбелязаните полета.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const data = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      const target = redirect && redirect.startsWith('/') ? redirect : '/dashboard';
      navigate(target, { replace: true, state: { flash: { type: 'success', message: data.message } } });
    } catch (err) {
      const fb = getErrorFeedback(err);
      setFeedback({ type: 'error', message: fb.message, errors: fb.errors });
      setErrors(getFieldErrors(fb.errors));
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (name, label, props = {}) => (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={form[name]}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={loading}
        aria-invalid={Boolean(errors[name])}
        className={`input ${errors[name] ? 'input-error' : ''}`}
        {...props}
      />
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="container-page flex min-h-[75vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-slate-900">Създай профил ✨</h1>
          <p className="mt-1 text-sm text-slate-500">Регистрирай се и запазвай часове за секунди.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <InlineFeedback type={feedback?.type} message={feedback?.message} errors={feedback?.errors} onClose={() => setFeedback(null)} />

          {renderInput('name', 'Име и фамилия', { placeholder: 'Иван Иванов', autoComplete: 'name', maxLength: 60 })}
          {renderInput('email', 'Имейл', { type: 'email', placeholder: 'ime@primer.bg', autoComplete: 'email' })}
          {renderInput('phone', 'Телефон (по желание)', { type: 'tel', placeholder: '+359 888 123 456', autoComplete: 'tel' })}

          <div>
            <label htmlFor="password" className="label">
              Парола
            </label>
            <PasswordInput
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Поне 6 символа"
              autoComplete="new-password"
              error={errors.password}
              disabled={loading}
            />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">
              Повтори паролата
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Същата парола"
              autoComplete="new-password"
              error={errors.confirmPassword}
              disabled={loading}
            />
            {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Зарежда...' : 'Регистрация'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Вече имаш профил?{' '}
          <Link to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="font-semibold text-brand-600 hover:underline">
            Влез
          </Link>
        </p>
      </div>
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/pages/Services.jsx' <<'AIBT_FILE_END_7f3a'
import { useEffect, useState } from 'react';
import api, { getErrorFeedback } from '../api/axios.js';
import useDebounce from '../hooks/useDebounce.js';
import CustomDropdown from '../components/CustomDropdown.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import InlineFeedback from '../components/InlineFeedback.jsx';
import Pagination from '../components/Pagination.jsx';
import { SkeletonGrid } from '../components/Skeleton.jsx';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Най-нови' },
  { value: 'price_asc', label: 'Цена: ниска → висока' },
  { value: 'price_desc', label: 'Цена: висока → ниска' },
  { value: 'duration_asc', label: 'Времетраене: кратко → дълго' },
  { value: 'duration_desc', label: 'Времетраене: дълго → кратко' },
  { value: 'title_asc', label: 'Име (А → Я)' },
];

export default function Services() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    api
      .get('/services/categories')
      .then((res) => setCategories((res.data.data || []).map((c) => ({ value: c, label: c }))))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => setPage(1), [debouncedSearch, category, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get('/services', { params: { page, limit: 9, search: debouncedSearch || undefined, category: category || undefined, sort } })
      .then((res) => {
        if (cancelled) return;
        setItems(res.data.data || []);
        setMeta(res.data.meta || { totalPages: 1, total: 0 });
      })
      .catch((err) => !cancelled && setError(getErrorFeedback(err).message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, category, sort, reloadKey]);

  const hasFilters = Boolean(search || category);

  return (
    <div className="container-page py-10">
      <div className="max-w-2xl">
        <h1 className="section-title">Нашите услуги</h1>
        <p className="mt-2 text-slate-500">Намери точната услуга за теб и запази час онлайн за секунди.</p>
      </div>

      <div className="card mt-8 grid gap-3 p-4 md:grid-cols-[1fr_220px_260px]">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.08 3.08a.75.75 0 11-1.06 1.06l-3.08-3.08A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Търси услуга по име..."
            className="input pl-9"
            aria-label="Търси услуга"
            maxLength={100}
          />
        </div>
        <CustomDropdown options={categories} value={category} onChange={setCategory} placeholder="Всички категории" clearable searchPlaceholder="Търси категория..." />
        <CustomDropdown options={SORT_OPTIONS} value={sort} onChange={(v) => setSort(v || 'newest')} placeholder="Подреди по" searchable={false} />
      </div>

      <div className="mt-8">
        {loading && <SkeletonGrid count={6} />}

        {!loading && error && (
          <InlineFeedback type="error" message={error}>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="mt-2 text-sm font-semibold underline">
              Опитай отново
            </button>
          </InlineFeedback>
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState
            title={hasFilters ? 'Няма услуги по тези критерии' : 'Все още няма нищо тук'}
            description={hasFilters ? 'Пробвай с друга дума или изчисти филтрите.' : 'Все още няма добавени услуги.'}
            actionLabel={hasFilters ? 'Изчисти филтрите' : 'Към началото'}
            onAction={hasFilters ? () => { setSearch(''); setCategory(''); } : undefined}
            actionTo={hasFilters ? undefined : '/'}
          />
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <ServiceCard key={s._id} service={s} />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} disabled={loading} />
      </div>
    </div>
  );
}
AIBT_FILE_END_7f3a

write_file 'frontend/src/utils/format.js' <<'AIBT_FILE_END_7f3a'
export const CURRENCY = 'EUR';

export const formatPrice = (value) =>
  new Intl.NumberFormat('bg-BG', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 }).format(Number(value) || 0);

export const formatDuration = (minutes) => {
  const m = Number(minutes) || 0;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (!h) return `${rest} мин`;
  return rest ? `${h} ч ${rest} мин` : `${h} ч`;
};

const pad = (n) => String(n).padStart(2, '0');

export const toDateStr = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const todayStr = () => toDateStr(new Date());

export const parseDateStr = (str) => new Date(`${str}T00:00:00`);

export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
// Index = JS getDay() (0 = Sunday)
export const WEEKDAYS_BY_INDEX = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
export const WEEKDAYS_SHORT_BY_INDEX = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
export const MONTHS = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];

export const formatDate = (dateStr, { withWeekday = true } = {}) => {
  if (!dateStr) return '';
  const d = parseDateStr(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const base = `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
  return withWeekday ? `${WEEKDAYS_BY_INDEX[d.getDay()]}, ${base}` : base;
};

export const BOOKING_STATUS = {
  pending: { label: 'Чакаща', className: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Потвърдена', className: 'bg-emerald-100 text-emerald-800' },
  completed: { label: 'Завършена', className: 'bg-sky-100 text-sky-800' },
  cancelled: { label: 'Отказана', className: 'bg-rose-100 text-rose-700' },
};

export const ROLE_LABELS = { admin: 'Администратор', staff: 'Служител', client: 'Клиент' };

export const TIME_OPTIONS = Array.from({ length: 35 }, (_, i) => {
  const minutes = 6 * 60 + i * 30; // 06:00 → 23:00
  const value = `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  return { value, label: value };
});

export const partOfDay = (time) => {
  const h = Number(String(time).split(':')[0]);
  if (h < 12) return 'Сутрин';
  if (h < 17) return 'Следобед';
  return 'Вечер';
};

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
AIBT_FILE_END_7f3a

echo ""
echo "✅ Всички файлове са създадени в: $TARGET"
echo ""

if command -v npm >/dev/null 2>&1; then
  echo "📦 Инсталирам зависимостите на backend..."
  (cd "$TARGET/backend" && npm install --no-audit --no-fund) || echo "⚠️  npm install за backend не успя – пусни го ръчно."
  echo "📦 Инсталирам зависимостите на frontend..."
  (cd "$TARGET/frontend" && npm install --no-audit --no-fund) || echo "⚠️  npm install за frontend не успя – пусни го ръчно."
else
  echo "⚠️  Node.js/npm не е намерен. Инсталирай Node.js 18+ от https://nodejs.org и пусни:"
  echo "    cd \"$TARGET/backend\" && npm install"
  echo "    cd \"$TARGET/frontend\" && npm install"
fi

echo ""
echo "=============================================="
echo "  СЛЕДВАЩИ СТЪПКИ"
echo "=============================================="
echo "1) Попълни backend/.env (MONGO_URI, JWT_SECRET ...)"
echo "2) cd \"$TARGET/backend\"  && npm run seed && npm run dev"
echo "3) cd \"$TARGET/frontend\" && npm run dev"
echo "4) Отвори http://localhost:5173  (admin@test.com / 123456)"
echo ""
