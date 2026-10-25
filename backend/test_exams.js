const mongoose = require('mongoose');
require('dotenv').config();
const Exam = require('./src/models/Exam');
const User = require('./src/models/User');

async function testExams() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const exams = await Exam.find({});
  console.log(`Found ${exams.length} exams in the database.`);
  
  exams.forEach(ex => {
    console.log(`- ${ex.title} | Active: ${ex.isActive}`);
  });

  const students = await User.find({ role: 'Student' });
  console.log(`\nFound ${students.length} students.`);

  process.exit(0);
}

testExams();
