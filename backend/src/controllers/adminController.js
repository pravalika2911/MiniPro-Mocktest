const asyncHandler = require('../middlewares/asyncHandler');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Session = require('../models/Session');
const { isDatabaseConnected } = require('../config/db');
const { getIO } = require('../config/socket');

const fallbackViolationFeed = [
  {
    studentName: 'Alex Mercer',
    studentEmail: 'student1@gmail.com',
    examName: 'AWS Certified Solutions Architect',
    violationType: 'TAB_SWITCH',
    timestamp: new Date(),
    sessionId: 'fallback-session-1'
  },
  {
    studentName: 'Priya Nair',
    studentEmail: 'student2@gmail.com',
    examName: 'React 19 & Next.js Mastery',
    violationType: 'EXIT_FULLSCREEN',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    sessionId: 'fallback-session-2'
  }
];

const fallbackSessions = [
  {
    _id: 'fallback-session-1',
    userId: { name: 'Alex Mercer', email: 'student1@gmail.com' },
    examId: { title: 'AWS Certified Solutions Architect', totalMarks: 200 },
    status: 'In-Progress',
    score: 0,
    violationCount: 1,
    createdAt: new Date()
  },
  {
    _id: 'fallback-session-2',
    userId: { name: 'Priya Nair', email: 'student2@gmail.com' },
    examId: { title: 'React 19 & Next.js Mastery', totalMarks: 150 },
    status: 'Auto-Submitted',
    score: 72,
    violationCount: 2,
    createdAt: new Date(Date.now() - 30 * 60 * 1000)
  }
];

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  if (!isDatabaseConnected()) {
    const totalStudents = 2;
    const totalExams = 3;
    const totalViolations = fallbackViolationFeed.length;

    return res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalStudents,
          totalExams,
          totalViolations
        },
        violationFeed: fallbackViolationFeed
      }
    });
  }

  const totalStudents = await User.countDocuments({ role: 'Student' });
  const totalExams = await Exam.countDocuments({});
  
  // Aggregate violations
  const sessionsWithViolations = await Session.find({ violationCount: { $gt: 0 } })
    .populate('userId', 'name email')
    .populate('examId', 'title')
    .sort({ updatedAt: -1 });

  let totalViolations = 0;
  const violationFeed = [];

sessionsWithViolations.forEach((session) => {
  totalViolations += session.violationCount || 0;

  (session.proctoringLogs || []).forEach((log) => {
    violationFeed.push({
      studentName: session.userId?.name || 'Unknown Student',
      studentEmail: session.userId?.email || 'N/A',
      examName: session.examId?.title || 'Unknown Exam',
      violationType: log.violationType,
      timestamp: log.timestamp,
      sessionId: session._id
    });
  });
});

  
  // Sort feed by most recent
  violationFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        totalStudents,
        totalExams,
        totalViolations
      },
      violationFeed
    }
  });
});

// @desc    Force terminate a session
// @route   PUT /api/admin/sessions/:id/terminate
// @access  Private/Admin
exports.terminateSession = asyncHandler(async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(200).json({
      status: 'success',
      message: 'Session terminated by administrative override.'
    });
  }

  const session = await Session.findById(req.params.id);
  
  if (!session) {
    return res.status(404).json({ status: 'error', message: 'Session not found' });
  }

  session.status = 'Auto-Submitted'; // Or 'Terminated' if we add to enum
  session.submittedAt = new Date();
  
  // Tag as security termination in logs
  session.proctoringLogs.push({ 
    timestamp: new Date(), 
    violationType: 'ADMIN_TERMINATION' 
  });
  
  await session.save();

  // EMIT SOCKET EVENT FOR INSTANT LOCKOUT
  try {
    const io = getIO();
    io.to(`session_${req.params.id}`).emit('session_terminated', { 
      reason: 'ADMIN_OVERRIDE',
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[SOCKET] Failed to emit termination event:', err.message);
  }

  res.status(200).json({
    status: 'success',
    message: 'Session terminated by administrative override.'
  });
});

// @desc    Get all exam sessions for reporting
// @route   GET /api/admin/sessions
// @access  Private/Admin
exports.getAllSessions = asyncHandler(async (req, res) => {
  if (!isDatabaseConnected()) {
    return res.status(200).json({
      status: 'success',
      count: fallbackSessions.length,
      data: { sessions: fallbackSessions }
    });
  }

  const sessions = await Session.find({})
    .populate('userId', 'name email')
    .populate('examId', 'title totalMarks')
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    count: sessions.length,
    data: { sessions }
  });
});

// @desc    Send a live warning to a candidate
// @route   POST /api/admin/sessions/:id/warn
// @access  Private/Admin
exports.sendWarning = asyncHandler(async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ status: 'error', message: 'Warning message is required' });
  }

  if (!isDatabaseConnected()) {
    return res.status(200).json({
      status: 'success',
      message: 'Warning transmitted to candidate node.'
    });
  }

  // EMIT SOCKET EVENT
  try {
    const io = getIO();
    io.to(`session_${req.params.id}`).emit('admin_warning', { 
      message,
      timestamp: new Date()
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Failed to transmit warning.' });
  }

  res.status(200).json({
    status: 'success',
    message: 'Warning transmitted to candidate node.'
  });
});
