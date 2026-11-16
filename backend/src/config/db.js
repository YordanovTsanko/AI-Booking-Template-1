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
