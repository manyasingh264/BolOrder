// upload.middleware.js — Multer configuration for audio file uploads.
//
// Used exclusively by the POST /api/orders/voice endpoint.
// Accepts: wav, mp3, ogg, webm, m4a audio files up to 25MB.
// Saves to: uploads/audio/ with a unique timestamped filename.
//
// Usage:
//   const uploadAudio = require('../middleware/upload.middleware');
//   router.post('/voice', authenticate, uploadAudio, controller.createVoiceOrder);

const multer = require('multer');
const path   = require('path');
const config = require('../config/env.config');
const AppError = require('../utils/AppError');

// ─── Allowed Audio MIME Types ──────────────────────────────────────────────────
// Browsers/apps may send different MIME types for the same format.
// WebM recorded from browser MediaRecorder API comes as 'audio/webm'.
const ALLOWED_MIME_TYPES = new Set([
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mpeg',      // .mp3
  'audio/mp4',       // .m4a
  'audio/m4a',
  'audio/ogg',
  'audio/webm',
  'video/webm',      // Chrome MediaRecorder sends webm audio as video/webm
  'audio/aac',
]);

// ─── Disk Storage ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Directory must exist — created by scripts/setup-dirs.js or manually.
    cb(null, config.upload.dir);
  },
  filename: (req, file, cb) => {
    // Unique filename prevents collisions when multiple salesmen upload simultaneously.
    const ext      = path.extname(file.originalname) || '.wav';
    const filename = `audio-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

// ─── File Filter ───────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Unsupported audio format "${file.mimetype}". Accepted: wav, mp3, ogg, webm, m4a`,
        400
      ),
      false
    );
  }
};

// ─── Multer Instance ───────────────────────────────────────────────────────────
const _multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeBytes, // 25MB default
    files:    1,                               // Only one audio file per request
  },
}).single('audio'); // The form field must be named 'audio'

// ─── Wrapped Middleware ────────────────────────────────────────────────────────
// Converts MulterError (a library-specific class) into our AppError format
// so the centralized errorHandler can handle it cleanly.
const uploadAudio = (req, res, next) => {
  _multerUpload(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMB = config.upload.maxFileSizeBytes / (1024 * 1024);
      return next(new AppError(`Audio file too large. Maximum size is ${maxMB}MB`, 400));
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(new AppError('Only one audio file can be uploaded at a time', 400));
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Unexpected field. Use the field name "audio" for the audio file', 400));
    }

    // AppError from fileFilter (unsupported type) passes through directly
    next(err);
  });
};

module.exports = uploadAudio;
