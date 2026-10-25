const express = require('express');
const { startExam, syncTimer, saveDraft, submitExam, getResult, logViolation } = require('../controllers/sessionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Allowed for both Student and Admin to view results
router.get('/:id/result', getResult);

router.use(authorize('Student')); // Admins don't take exams in this setup

router.post('/start', startExam);
router.get('/:id/sync', syncTimer);
router.put('/:id/draft', saveDraft);
router.post('/:id/submit', submitExam);
router.put('/:id/violation', logViolation);

module.exports = router;
