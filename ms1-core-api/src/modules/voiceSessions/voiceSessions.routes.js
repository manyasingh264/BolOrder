// voiceSessions.routes.js — routes for voice session proxy to MS2.
//
// These routes proxy requests from the frontend to MS2's conversation API.
// All routes require authentication via JWT middleware.

const { Router } = require('express');
const authMiddleware = require('../../middleware/authenticate.middleware');
const voiceSessionsController = require('./voiceSessions.controller');

const router = Router();

// All voice session routes require authentication
router.use(authMiddleware);

// POST /api/voice-sessions/start
router.post('/start', voiceSessionsController.startSession);

// POST /api/voice-sessions/:sessionId/audio
router.post('/:sessionId/audio', voiceSessionsController.sendAudio);

// POST /api/voice-sessions/:sessionId/reply
router.post('/:sessionId/reply', voiceSessionsController.sendReply);

// DELETE /api/voice-sessions/:sessionId
router.delete('/:sessionId', voiceSessionsController.endSession);

module.exports = router;
