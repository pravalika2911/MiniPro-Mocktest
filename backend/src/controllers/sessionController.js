const Session = require('../models/Session');
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const asyncHandler = require('../middlewares/asyncHandler');
const { isDatabaseConnected } = require('../config/db');

const fallbackExamCatalog = {
  'fallback-aws': {
    _id: 'fallback-aws',
    title: 'AWS Certified Solutions Architect',
    description: 'Validate expertise in designing distributed, fault-tolerant, and scalable systems on AWS.',
    category: 'Cloud Architecture',
    difficulty: 'Hard',
    durationMinutes: 90,
    totalMarks: 200,
    isActive: true
  },
  'fallback-react': {
    _id: 'fallback-react',
    title: 'React 19 & Next.js Mastery',
    description: 'Deep-dive into React Server Components, App Router, edge rendering, and advanced hooks.',
    category: 'Technical/Coding',
    difficulty: 'Medium',
    durationMinutes: 60,
    totalMarks: 150,
    isActive: true
  },
  'fallback-python': {
    _id: 'fallback-python',
    title: 'Python Backend Algorithms',
    description: 'Advanced data structures, complexity analysis, and backend logic for production systems.',
    category: 'Technical/Coding',
    difficulty: 'Hard',
    durationMinutes: 90,
    totalMarks: 170,
    isActive: true
  }
};

const fallbackQuestionCatalog = {
  'fallback-aws': [
    {
      _id: 'fallback-aws-q1',
      examId: 'fallback-aws',
      questionText: 'Which AWS service best decouples microservices while preserving message durability?',
      options: ['Amazon SNS', 'Amazon SQS', 'AWS EventBridge', 'Amazon Kinesis'],
      correctOption: 'Amazon SQS',
      marks: 10,
      type: 'mcq'
    }
  ],
  'fallback-react': [
    {
      _id: 'fallback-react-q1',
      examId: 'fallback-react',
      questionText: 'In Next.js App Router, which file defines a shared UI layout for a segment and its children?',
      options: ['page.tsx', 'layout.tsx', 'template.tsx', 'route.tsx'],
      correctOption: 'layout.tsx',
      marks: 10,
      type: 'mcq'
    }
  ],
  'fallback-python': [
    {
      _id: 'fallback-python-q1',
      examId: 'fallback-python',
      questionText: 'What is the time complexity of binary search on a sorted array?',
      options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
      correctOption: 'O(log n)',
      marks: 10,
      type: 'mcq'
    }
  ]
};

const fallbackSessions = new Map();

// ─── Fisher-Yates Shuffling Utility ───────────────────────────────────────────
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// @desc    Start an exam session
// @route   POST /api/sessions/start
// @access  Private/Student
exports.startExam = asyncHandler(async (req, res) => {
  const { examId } = req.body;
  const isFallbackExam = Boolean(fallbackExamCatalog[examId]);

  if (!isDatabaseConnected() || isFallbackExam) {
    const exam = fallbackExamCatalog[examId];
    if (!exam || !exam.isActive) {
      return res.status(404).json({ status: 'error', message: 'Active exam not found' });
    }

    const existing = [...fallbackSessions.values()].find(
      (session) => session.userId === req.user.id && session.examId === examId && session.status === 'In-Progress'
    );

    if (existing) {
      return res.status(200).json({
        status: 'success',
        message: 'Session resumed',
        data: { sessionId: existing._id }
      });
    }

    const questions = fallbackQuestionCatalog[examId] || [];
    const shuffledQuestions = shuffleArray([...questions]);
    const questionOrder = shuffledQuestions.map((q) => ({
      questionId: q._id,
      shuffledOptions: shuffleArray([...q.options])
    }));

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + exam.durationMinutes * 60000);
    const sessionId = `fallback-session-${req.user.id}-${examId}-${Date.now()}`;
    const session = {
      _id: sessionId,
      userId: req.user.id,
      examId,
      startTime,
      endTime,
      status: 'In-Progress',
      questionOrder,
      answers: []
    };

    fallbackSessions.set(sessionId, session);

    const questionsToClient = shuffledQuestions.map((q) => {
      const orderObj = questionOrder.find((o) => o.questionId === q._id);
      return {
        _id: q._id,
        questionText: q.questionText,
        options: orderObj.shuffledOptions,
        marks: q.marks,
        type: q.type,
        sjtScoring: q.sjtScoring,
        correctOrder: q.correctOrder
      };
    });

    return res.status(201).json({
      status: 'success',
      data: {
        session,
        questions: questionsToClient
      }
    });
  }

  const exam = await Exam.findById(examId);
  if (!exam || !exam.isActive) {
    return res.status(404).json({ status: 'error', message: 'Active exam not found' });
  }

  // Support session resumption
  let session = await Session.findOne({ userId: req.user.id, examId });
  
  if (session) {
    if (session.status !== 'In-Progress') {
      return res.status(400).json({ status: 'error', message: 'You have already completed this exam module.' });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Session resumed',
      data: { sessionId: session._id }
    });
  }

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + exam.durationMinutes * 60000);

  // ─── ULTIMATE INTEGRITY: SHUFFLING ─────────────────────────────────────────
  const questions = await Question.find({ examId });
  
  // Shuffle Question Sequence
  const shuffledQuestions = shuffleArray([...questions]);

  // Generate unique Question Order for this session with Shuffled Options
  const questionOrder = shuffledQuestions.map(q => ({
    questionId: q._id,
    shuffledOptions: shuffleArray([...q.options])
  }));

  session = await Session.create({
    userId: req.user.id,
    examId,
    startTime,
    endTime,
    status: 'In-Progress',
    questionOrder,
    answers: []
  });

  // Prepare randomized question payload for client
  const questionsToClient = shuffledQuestions.map(q => {
    const orderObj = questionOrder.find(o => o.questionId.toString() === q._id.toString());
    return {
      _id: q._id,
      questionText: q.questionText,
      options: orderObj.shuffledOptions,
      marks: q.marks,
      type: q.type,
      sjtScoring: q.sjtScoring,
      correctOrder: q.correctOrder
    };
  });

  res.status(201).json({
    status: 'success',
    data: {
      session,
      questions: questionsToClient
    }
  });
});

// @desc    Ping to sync timer
// @route   GET /api/sessions/:id/sync
// @access  Private
exports.syncTimer = asyncHandler(async (req, res) => {
  if (!isDatabaseConnected()) {
    const session = fallbackSessions.get(req.params.id);
    if (!session) {
      return res.status(404).json({ status: 'error', message: 'Session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not authorized for this session' });
    }

    const exam = fallbackExamCatalog[session.examId] || { title: 'Fallback exam' };
    return res.status(200).json({
      status: 'success',
      data: {
        serverTime: new Date(),
        endTime: session.endTime,
        isExpired: false,
        answers: session.answers,
        status: session.status,
        examType: 'standard',
        scenarioContext: null,
        questions: (session.questionOrder || []).map((orderItem) => {
          const q = (fallbackQuestionCatalog[session.examId] || []).find((item) => item._id === orderItem.questionId);
          return {
            _id: q?._id,
            questionText: q?.questionText,
            options: orderItem.shuffledOptions,
            marks: q?.marks,
            type: q?.type,
            sjtScoring: q?.sjtScoring,
            correctOrder: q?.correctOrder
          };
        })
      }
    });
  }

  const session = await Session.findById(req.params.id).populate('examId', 'examType scenarioContext title');
  if (!session) {
    return res.status(404).json({ status: 'error', message: 'Session not found' });
  }
  
  // Ensure user owns this session
  if (session.userId.toString() !== req.user.id) {
     return res.status(403).json({ status: 'error', message: 'Not authorized for this session' });
  }

  // To support page reload seamlessly, provide the randomized questions in correct order
  const allQuestions = await Question.find({ examId: session.examId }).select('-correctOption');
  
  const questionsToClient = session.questionOrder.map(orderItem => {
     const q = allQuestions.find(orig => orig._id.toString() === orderItem.questionId.toString());
     return {
        _id: q._id,
        questionText: q.questionText,
        options: orderItem.shuffledOptions,
        marks: q.marks,
        type: q.type,
        sjtScoring: q.sjtScoring,
        correctOrder: q.correctOrder
     };
  });

  res.status(200).json({
    status: 'success',
    data: {
      serverTime: new Date(),
      endTime: session.endTime,
      isExpired: session.isExpired(),
      answers: session.answers,
      status: session.status,
      examType: session.examId?.examType || 'standard',
      scenarioContext: session.examId?.scenarioContext || null,
      questions: questionsToClient
    }
  });
});

// @desc    Auto-save draft answers
// @route   PUT /api/sessions/:id/draft
// @access  Private
exports.saveDraft = asyncHandler(async (req, res) => {
  const { answers } = req.body; // Array of { questionId, selectedOption }

  if (!isDatabaseConnected()) {
    const session = fallbackSessions.get(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ status: 'error', message: 'Not authorized' });
    session.answers = answers || [];
    return res.status(200).json({ status: 'success', message: 'Draft saved' });
  }
  
  const session = await Session.findById(req.params.id);
  
  if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
  if (session.userId.toString() !== req.user.id) return res.status(403).json({ status: 'error', message: 'Not authorized' });

  // STRICT ANTI-CHEAT CHECK
  if (session.isExpired() || session.status !== 'In-Progress') {
    return res.status(403).json({ status: 'error', message: 'Exam time expired or already submitted' });
  }

  session.answers = answers;
  await session.save();

  res.status(200).json({ status: 'success', message: 'Draft saved' });
});

// @desc    Submit exam for final evaluation
// @route   POST /api/sessions/:id/submit
// @access  Private
exports.submitExam = asyncHandler(async (req, res) => {
  const { answers } = req.body; // Final answers array (if not tampered)

  if (!isDatabaseConnected()) {
    const session = fallbackSessions.get(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ status: 'error', message: 'Not authorized' });
    if (session.status !== 'In-Progress') return res.status(400).json({ status: 'error', message: 'Exam already submitted' });

    session.answers = answers || session.answers;
    session.status = 'Completed';
    session.submittedAt = new Date();
    const questions = fallbackQuestionCatalog[session.examId] || [];
    const score = session.answers.reduce((total, ans) => {
      const q = questions.find((question) => question._id === ans.questionId);
      return q && q.correctOption === ans.selectedOption ? total + q.marks : total;
    }, 0);
    session.score = score;
    return res.status(200).json({ status: 'success', data: { session } });
  }
  
  const session = await Session.findById(req.params.id);
  
  if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
  if (session.userId.toString() !== req.user.id) return res.status(403).json({ status: 'error', message: 'Not authorized' });

  // Strictly check if already submitted
  if (session.status !== 'In-Progress') {
    return res.status(400).json({ status: 'error', message: 'Exam already submitted' });
  }

  // Strict time boundary
  if (session.isExpired()) {
    // We update to Auto-Submitted and force evaluate existing drafts (ignore payload)
    session.status = 'Auto-Submitted';
  } else {
    // Normal submission (can accept the incoming answers payload)
    if (answers) {
       session.answers = answers;
    }
    session.status = 'Completed';
  }

  session.submittedAt = new Date();

  // Evaluate Score
  const questions = await Question.find({ examId: session.examId });
  let score = 0;
  
  session.answers.forEach(ans => {
     const q = questions.find(question => question._id.toString() === ans.questionId.toString());
     if (q && q.correctOption === ans.selectedOption) {
        score += q.marks;
     }
  });

  session.score = score;
  await session.save();

  res.status(200).json({ 
    status: 'success', 
    data: { session } 
  });
});

// @desc    Get session result
// @route   GET /api/sessions/:id/result
// @access  Private
exports.getResult = asyncHandler(async (req, res) => {
  if (!isDatabaseConnected()) {
    const session = fallbackSessions.get(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
    if (session.userId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ status: 'error', message: 'Not authorized' });
    }

    const questions = fallbackQuestionCatalog[session.examId] || [];
    let correctCount = 0;
    let incorrectCount = 0;
    const detailedAnalysis = questions.map((q) => {
      const ans = session.answers.find((a) => a.questionId === q._id) || null;
      const studentAnswer = ans ? ans.selectedOption : null;
      const isCorrect = studentAnswer === q.correctOption;
      if (isCorrect) correctCount += 1; else if (studentAnswer) incorrectCount += 1;
      return {
        questionId: q._id,
        questionText: q.questionText,
        type: q.type,
        correctOption: q.correctOption,
        studentAnswer,
        isCorrect
      };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        session,
        stats: {
          totalQuestions: questions.length,
          correctCount,
          incorrectCount,
          unattemptedCount: Math.max(questions.length - session.answers.length, 0)
        },
        detailedAnalysis
      }
    });
  }

  const session = await Session.findById(req.params.id)
     .populate('examId', 'title durationMinutes totalMarks');
     
  if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
  if (session.userId.toString() !== req.user.id && req.user.role !== 'Admin') {
     return res.status(403).json({ status: 'error', message: 'Not authorized' });
  }
  
  if (session.status === 'In-Progress') {
     return res.status(400).json({ status: 'error', message: 'Exam is still in progress' });
  }

  // Calculate stats
  const questions = await Question.find({ examId: session.examId });
  
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = questions.length - session.answers.length;

  session.answers.forEach(ans => {
     const q = questions.find(question => question._id.toString() === ans.questionId.toString());
     if (q && q.correctOption === ans.selectedOption) {
        correctCount++;
     } else {
        incorrectCount++;
     }
  });

  const detailedAnalysis = questions.map(q => {
     const ans = session.answers.find(a => a.questionId.toString() === q._id.toString());
     const studentAnswer = ans ? ans.selectedOption : null;
     const isCorrect = studentAnswer === q.correctOption;
     return {
        questionId: q._id,
        questionText: q.questionText,
        type: q.type,
        correctOption: q.correctOption,
        studentAnswer,
        isCorrect
     };
  });

  res.status(200).json({
    status: 'success',
    data: {
      session,
      stats: {
        totalQuestions: questions.length,
        correctCount,
        incorrectCount,
        unattemptedCount
      },
      detailedAnalysis
    }
  });
});

// @desc    Get logged in student progress analytics
// @route   GET /api/sessions/my-progress
// @access  Private/Student
exports.getMyProgress = asyncHandler(async (req, res) => {
  if (!isDatabaseConnected()) {
    const sessions = [...fallbackSessions.values()].filter(
      (session) => session.userId === req.user.id && ['Completed', 'Auto-Submitted'].includes(session.status)
    );

    const timelineData = sessions.map((session) => ({
      date: new Date(session.startTime).toLocaleDateString(),
      score: Math.round(((session.score || 0) / (fallbackExamCatalog[session.examId]?.totalMarks || 100)) * 100),
      exam: fallbackExamCatalog[session.examId]?.title || session.examId
    })).reverse();

    return res.status(200).json({
      status: 'success',
      data: {
        radarData: [],
        timelineData,
        summary: {
          totalExams: sessions.length,
          avgScore: sessions.length ? Math.round(timelineData.reduce((acc, curr) => acc + curr.score, 0) / sessions.length) : 0
        }
      }
    });
  }

  const sessions = await Session.find({ 
    userId: req.user.id, 
    status: { $in: ['Completed', 'Auto-Submitted'] } 
  }).populate('examId', 'category title totalMarks');

  // Aggregate by Category
  const categoryStats = {};
  
  sessions.forEach(s => {
    const cat = s.examId.category || 'General';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { category: cat, totalScore: 0, maxPossible: 0, count: 0 };
    }
    categoryStats[cat].totalScore += s.score || 0;
    categoryStats[cat].maxPossible += s.examId.totalMarks || 100;
    categoryStats[cat].count += 1;
  });

  const radarData = Object.values(categoryStats).map(c => ({
    subject: c.category,
    A: Math.round((c.totalScore / c.maxPossible) * 100),
    fullMark: 100
  }));

  // Timeline Data
  const timelineData = sessions.map(s => ({
    date: new Date(s.createdAt).toLocaleDateString(),
    score: Math.round(((s.score || 0) / (s.examId.totalMarks || 100)) * 100),
    exam: s.examId.title
  })).reverse();

  res.status(200).json({
    status: 'success',
    data: {
      radarData,
      timelineData,
      summary: {
        totalExams: sessions.length,
        avgScore: Math.round(timelineData.reduce((acc, curr) => acc + curr.score, 0) / sessions.length) || 0
      }
    }
  });
});

// @desc    Log a proctoring violation
// @route   PUT /api/sessions/:id/violation
// @access  Private
exports.logViolation = asyncHandler(async (req, res) => {
  if (!isDatabaseConnected()) {
    const session = fallbackSessions.get(req.params.id);
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
    if (session.userId !== req.user.id) return res.status(403).json({ status: 'error', message: 'Not authorized' });
    if (session.status !== 'In-Progress') return res.status(400).json({ status: 'error', message: 'Exam not in progress' });

    const { type } = req.body;
    session.proctoringLogs = session.proctoringLogs || [];
    session.proctoringLogs.push({ timestamp: new Date(), violationType: type });
    session.violationCount = (session.violationCount || 0) + 1;
    return res.status(200).json({
      status: 'success',
      data: { violationCount: session.violationCount }
    });
  }

  const session = await Session.findById(req.params.id);
  
  if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' });
  if (session.userId.toString() !== req.user.id) return res.status(403).json({ status: 'error', message: 'Not authorized' });
  if (session.status !== 'In-Progress') return res.status(400).json({ status: 'error', message: 'Exam not in progress' });

  const { type } = req.body;
  
  session.proctoringLogs.push({ timestamp: new Date(), violationType: type });
  session.violationCount += 1;
  
  await session.save();

  res.status(200).json({
    status: 'success',
    data: { violationCount: session.violationCount }
  });
});
