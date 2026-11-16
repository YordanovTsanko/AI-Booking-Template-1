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
