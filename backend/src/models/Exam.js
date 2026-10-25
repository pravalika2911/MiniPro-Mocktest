const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Technical/Coding', 
      'Aptitude/Reasoning', 
      'Psychometric/Personality', 
      'Cloud Architecture', 
      'Cybersecurity', 
      'Data Science',
      'Management/HR',
      'Situational Judgment'
    ],
    default: 'Technical/Coding'
  },
  examType: {
    type: String,
    enum: ['standard', 'scenario-based'],
    default: 'standard'
  },
  scenarioContext: {
    type: String,
    trim: true,
    description: 'Shared scenario/case study text for scenario-based exams.'
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  durationMinutes: {
    type: Number,
    required: [true, 'Duration in minutes is required'],
    min: [1, 'Duration must be at least 1 minute'],
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks are required'],
    min: [0, 'Total marks cannot be negative'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
