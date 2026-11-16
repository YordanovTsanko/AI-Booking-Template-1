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
