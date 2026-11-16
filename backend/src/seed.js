/**
 * Seed script: npm run seed
 * Creates: 1 admin, 3 staff, 1 demo client, 6 services, 5 bookings.
 * WARNING: wipes Users, Services, Bookings and AI chat messages first.
 */
import './config/env.js';
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
