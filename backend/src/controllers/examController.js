const Exam = require('../models/Exam');
const Question = require('../models/Question');
const asyncHandler = require('../middlewares/asyncHandler');
const { isDatabaseConnected } = require('../config/db');

const fallbackExams = [
  {
    _id: 'fallback-aws',
    title: 'AWS Certified Solutions Architect',
    description: 'Validate expertise in designing distributed, fault-tolerant, and scalable systems on AWS.',
    category: 'Cloud Architecture',
    difficulty: 'Hard',
    durationMinutes: 90,
    totalMarks: 200,
    isActive: true,
    createdBy: 'fallback-admin'
  },
  {
    _id: 'fallback-react',
    title: 'React 19 & Next.js Mastery',
    description: 'Deep-dive into React Server Components, App Router, edge rendering, and advanced hooks.',
    category: 'Technical/Coding',
    difficulty: 'Medium',
    durationMinutes: 60,
    totalMarks: 150,
    isActive: true,
    createdBy: 'fallback-admin'
  },
  {
    _id: 'fallback-python',
    title: 'Python Backend Algorithms',
    description: 'Advanced data structures, complexity analysis, and backend logic for production systems.',
    category: 'Technical/Coding',
    difficulty: 'Hard',
    durationMinutes: 90,
    totalMarks: 170,
    isActive: true,
    createdBy: 'fallback-admin'
  }
];

const fallbackQuestionsByExamId = {
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

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private/Admin
exports.createExam = asyncHandler(async (req, res) => {
  const { title, description, category, difficulty, durationMinutes, totalMarks, isActive } = req.body;

  const exam = await Exam.create({
    title,
    description,
    category,
    difficulty,
    durationMinutes,
    totalMarks,
    isActive,
    createdBy: req.user.id
  });

  res.status(201).json({ status: 'success', data: { exam } });
});

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
exports.getExams = asyncHandler(async (req, res) => {
  if (!isDatabaseConnected()) {
    const exams = fallbackExams.filter((exam) => req.user?.role !== 'Student' || exam.isActive);
    return res.status(200).json({ status: 'success', count: exams.length, data: { exams } });
  }

  // If student, only show active exams. Admins see all.
  const filter = req.user.role === 'Student' ? { isActive: true } : {};
  const exams = await Exam.find(filter).select('-__v');
  res.status(200).json({ status: 'success', count: exams.length, data: { exams } });
});

// @desc    Get single exam with its questions (if admin) or without (if listing)
// @route   GET /api/exams/:id
// @access  Private
exports.getExam = asyncHandler(async (req, res) => {
  if (!isDatabaseConnected()) {
    const exam = fallbackExams.find((item) => item._id === req.params.id);
    if (!exam) {
      return res.status(404).json({ status: 'error', message: 'Exam not found' });
    }

    const questions = req.user.role === 'Admin' ? (fallbackQuestionsByExamId[exam._id] || []) : [];
    return res.status(200).json({ status: 'success', data: { exam, questions } });
  }

  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    return res.status(404).json({ status: 'error', message: 'Exam not found' });
  }
  
  let questions = [];
  if (req.user.role === 'Admin') {
    questions = await Question.find({ examId: req.params.id });
  }

  res.status(200).json({ status: 'success', data: { exam, questions } });
});

// @desc    Add question to exam
// @route   POST /api/exams/:id/questions
// @access  Private/Admin
exports.addQuestion = asyncHandler(async (req, res) => {
  const { questionText, options, correctOption, marks } = req.body;
  
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    return res.status(404).json({ status: 'error', message: 'Exam not found' });
  }

  const question = await Question.create({
    examId: req.params.id,
    questionText,
    options,
    correctOption,
    marks
  });

  res.status(201).json({ status: 'success', data: { question } });
});

// @desc    Bulk add questions to exam
// @route   POST /api/exams/:id/questions/bulk
// @access  Private/Admin
exports.bulkAddQuestions = asyncHandler(async (req, res) => {
  const { questions } = req.body; // Array of question objects
  
  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ status: 'error', message: 'No questions provided for bulk upload' });
  }

  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    return res.status(404).json({ status: 'error', message: 'Exam not found' });
  }

  // Attach examId to each question
  const questionsToInsert = questions.map(q => ({
    ...q,
    examId: req.params.id
  }));

  const insertedQuestions = await Question.insertMany(questionsToInsert);

  res.status(201).json({ 
    status: 'success', 
    count: insertedQuestions.length,
    message: `${insertedQuestions.length} logic modules successfully injected.`
  });
});
