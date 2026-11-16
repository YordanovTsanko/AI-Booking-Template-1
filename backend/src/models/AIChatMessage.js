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
