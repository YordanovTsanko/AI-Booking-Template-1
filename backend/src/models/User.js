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

// Mongoose 9: async middleware without next()
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
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
