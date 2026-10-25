const express = require('express');
const { getDashboardStats, terminateSession, getAllSessions, sendWarning } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('Admin'));

router.get('/dashboard', getDashboardStats);
router.get('/sessions', getAllSessions);
router.post('/sessions/:id/warn', sendWarning);
router.put('/sessions/:id/terminate', terminateSession);

module.exports = router;
