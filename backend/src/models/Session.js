const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  selectedOption: {
    type: String,
    default: null,
  }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  status: {
    type: String,
    enum: ['In-Progress', 'Completed', 'Auto-Submitted'],
    default: 'In-Progress',
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
  },
  questionOrder: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    shuffledOptions: [String]
  }],
  answers: [answerSchema],
  proctoringLogs: [{
    timestamp: { type: Date, default: Date.now },
    violationType: String,
    _id: false
  }],
  violationCount: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: null,
  },
  submittedAt: {
    type: Date,
    default: null,
  }
}, { timestamps: true });

// Prevent submission if end time has strictly passed + 5 seconds grace period
sessionSchema.methods.isExpired = function () {
  const gracePeriodMs = 5000;
  return Date.now() > (this.endTime.getTime() + gracePeriodMs);
};

module.exports = mongoose.model('Session', sessionSchema);
