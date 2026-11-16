// Loads backend/.env before anything else reads process.env.
// Must be the FIRST import in server.js and seed.js.
// quiet: true hides the dotenv "injecting env" tip printed since dotenv v17.
import dotenv from 'dotenv';

dotenv.config({ quiet: true });
