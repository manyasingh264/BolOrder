// env.config.js — the ONLY file in the project that reads process.env.
//
// Why centralize this?
//   - If an env variable is renamed, we change it here and nowhere else.
//   - The app fails immediately on startup if a required variable is missing,
//     instead of crashing later during a request.
//   - Every other file imports `config` from here — no magic strings scattered around.

require('dotenv').config();

// ─── Validate Required Variables ──────────────────────────────────────────────
// These variables MUST exist. If they don't, crash immediately with a clear message.
const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET'];

const missingVars = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('   Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

// ─── Export Config Object ─────────────────────────────────────────────────────
const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  fastapi: {
    baseUrl: process.env.FASTAPI_BASE_URL || 'http://localhost:8000',
  },

  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads/audio',
    maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10) * 1024 * 1024,
  },

  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sesFromEmail: process.env.AWS_SES_FROM_EMAIL,
  },
};

module.exports = config;
