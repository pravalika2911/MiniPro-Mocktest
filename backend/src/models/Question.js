const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
  },
  type: {
    type: String,
    enum: ['mcq', 'coding', 'sjt', 'ranking'],
    default: 'mcq'
  },
  options: {
    type: [String],
    validate: [
      function(v) { return this.type === 'coding' || (v && v.length >= 2); },
      'An MCQ must have at least two options'
    ],
  },
  correctOption: {
    type: String,
    required: [
      function() { return this.type === 'mcq'; },
      'Correct option is required for MCQ'
    ],
  },
  correctOrder: {
    type: [String],
    description: 'Array defining correct sequence for ranking questions.',
    required: [
      function() { return this.type === 'ranking'; },
      'Correct order is required for ranking questions'
    ]
  },
  sjtScoring: {
    type: Map,
    of: Number,
    description: 'Map of option ID/String to partial marks (e.g., {"Panic ping CEO": 0, "Update status page": 5}) for SJT.'
  },
  marks: {
    type: Number,
    required: [true, 'Marks for this question are required'],
    min: [1, 'Marks must be at least 1'],
  }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
