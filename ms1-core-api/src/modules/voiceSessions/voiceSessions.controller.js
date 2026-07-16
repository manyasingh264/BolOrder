// voiceSessions.controller.js — handles HTTP requests for voice session proxy to MS2.
//
// This controller proxies requests from the frontend to MS2's conversation API.
// MS1 injects auth_token and salesman_id from the authenticated request context.
// The frontend never talks to MS2 directly.

const fs = require('fs');
const multer = require('multer');

const voiceSessionService = require('../../services/voiceSession.service');
const sendResponse = require('../../utils/sendResponse');
const AppError = require('../../utils/AppError');

// ─── Multer Config for Audio Upload ─────────────────────────────────────────────
// Store uploaded audio files temporarily in uploads/audio
const upload = multer({
  dest: 'uploads/audio',
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept common audio formats
    const allowedMimes = [
      'audio/webm',
      'audio/ogg',
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/m4a',
      'audio/mp4',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Please upload an audio file.', 400), false);
    }
  },
});

// POST /api/voice-sessions/start
const startSession = async (req, res, next) => {
  try {
    const result = await voiceSessionService.startConversation();
    return sendResponse(res, 200, true, 'Voice session started', result);
  } catch (error) { next(error); }
};

// POST /api/voice-sessions/:sessionId/audio
const sendAudio = async (req, res, next) => {
  const audioFile = req.file;
  const { sessionId } = req.params;

  try {
    if (!audioFile) {
      throw new AppError('No audio file provided. Please upload an audio file.', 400);
    }

    // Inject auth token and salesman ID from authenticated request
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const salesmanId = req.user?.userId;

    if (!authToken || !salesmanId) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const result = await voiceSessionService.sendAudio(
      sessionId,
      audioFile.path,
      authToken,
      salesmanId
    );

    // Clean up temp audio file
    if (fs.existsSync(audioFile.path)) {
      fs.unlinkSync(audioFile.path);
    }

    return sendResponse(res, 200, true, 'Audio processed successfully', result);

  } catch (error) {
    // Clean up temp audio file on error
    if (audioFile && fs.existsSync(audioFile.path)) {
      fs.unlinkSync(audioFile.path);
    }
    next(error);
  }
};

// POST /api/voice-sessions/:sessionId/reply
const sendReply = async (req, res, next) => {
  const { sessionId } = req.params;
  const { reply } = req.body;

  try {
    if (!reply || typeof reply !== 'string') {
      throw new AppError('Reply text is required.', 400);
    }

    // Inject auth token from authenticated request
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    if (!authToken) {
      throw new AppError('Authentication required. Please log in.', 401);
    }

    const result = await voiceSessionService.sendReply(sessionId, reply, authToken);
    return sendResponse(res, 200, true, 'Reply processed successfully', result);

  } catch (error) { next(error); }
};

// DELETE /api/voice-sessions/:sessionId
const endSession = async (req, res, next) => {
  const { sessionId } = req.params;

  try {
    const result = await voiceSessionService.endConversation(sessionId);
    return sendResponse(res, 200, true, 'Voice session ended', result);
  } catch (error) { next(error); }
};

module.exports = {
  startSession,
  sendAudio: [upload.single('audio'), sendAudio], // Wrap with multer middleware
  sendReply,
  endSession,
};
