const express = require('express');
const { createExam, getExams, getExam, addQuestion, bulkAddQuestions } = require('../controllers/examController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
  .post(authorize('Admin'), createExam)
  .get(getExams);

router.route('/:id')
  .get(getExam);

router.route('/:id/questions')
  .post(authorize('Admin'), addQuestion);

router.route('/:id/questions/bulk')
  .post(authorize('Admin'), bulkAddQuestions);

module.exports = router;
