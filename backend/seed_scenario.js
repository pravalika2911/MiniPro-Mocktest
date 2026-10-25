require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Exam = require('./src/models/Exam');
const Question = require('./src/models/Question');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mock-test-platform')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });

const seedScenario = async () => {
  try {
    // 1. Get an existing admin to be the creator
    const admin = await User.findOne({ role: /admin/i });
    if (!admin) {
        console.log("No admin found. Create one first.");
        process.exit(1);
    }

    // 2. Clear old scenario-based test if it exists
    await Exam.deleteMany({ title: 'DevOps Incident Response Scenario' });

    // 3. Create Scenario Exam
    const exam = await Exam.create({
      title: 'DevOps Incident Response Scenario',
      description: 'A mock simulation of a production server outage. Test your operational judgment.',
      category: 'Situational Judgment',
      examType: 'scenario-based',
      scenarioContext: `[INCIDENT TICKET #9942]\n\nTIME: 03:00 AM PST\nSEVERITY: CRITICAL (P0)\n\nREPORT:\nThe main payment gateway service has started throwing 502 Bad Gateway errors. Customer checkout is currently halted. The database CPU utilization has spiked to 100% and there are over 5,000 pending connections in the pool.\n\nCOMMUNICATION LOGS:\n[03:02 AM] Support: "Customers are complaining on Twitter that their cards are being charged but they are getting an error page."\n[03:05 AM] Security Ops: "We see a very high number of requests originating from an unusual IP block in Eastern Europe hitting the checkout endpoint."\n\nYour task is to analyze the situation, rank the immediate incident response actions, and choose the most appropriate way to communicate with stakeholders.`,
      difficulty: 'Hard',
      durationMinutes: 45,
      totalMarks: 100,
      createdBy: admin._id,
      isActive: true
    });

    console.log('Created Exam:', exam.title);

    // 4. Create Questions
    // Q1: Ranking
    await Question.create({
      examId: exam._id,
      questionText: 'Rank the following incident response steps in the exact chronological order you should perform them:',
      type: 'ranking',
      options: [
        'Communicate the outage to the Head of E-Commerce.',
        'Review the logs to identify the specific query or process causing the 100% CPU spike.',
        'Implement an IP block on the suspicious traffic originating from Eastern Europe.',
        'Isolate the compromised database node and failover to the replica.'
      ],
      correctOrder: [
        'Implement an IP block on the suspicious traffic originating from Eastern Europe.',
        'Isolate the compromised database node and failover to the replica.',
        'Review the logs to identify the specific query or process causing the 100% CPU spike.',
        'Communicate the outage to the Head of E-Commerce.'
      ],
      marks: 15
    });

    // Q2: SJT
    await Question.create({
      examId: exam._id,
      questionText: 'You realize that fixing the database corruption will take at least 3 hours. How do you handle customer communication regarding the erroneous charges?',
      type: 'sjt',
      options: [
        'Ignore social media until the database is fixed, then issue a blanket apology.',
        'Wait until morning when the PR team is online to draft a response.',
        'Immediately post an update on the status page acknowledging the issue and assuring that erroneous charges will be auto-refunded, then update Twitter.',
        'Individually reply to every disgruntled customer on Twitter asking for their order numbers while you try to fix the DB.'
      ],
      sjtScoring: {
        'Ignore social media until the database is fixed, then issue a blanket apology.': 0,
        'Wait until morning when the PR team is online to draft a response.': 2,
        'Immediately post an update on the status page acknowledging the issue and assuring that erroneous charges will be auto-refunded, then update Twitter.': 10,
        'Individually reply to every disgruntled customer on Twitter asking for their order numbers while you try to fix the DB.': 4
      },
      marks: 10
    });

    // Q3: MCQ
    await Question.create({
      examId: exam._id,
      questionText: 'Which HTTP status code officially represents "Bad Gateway"?',
      type: 'mcq',
      options: ['HTTP 500', 'HTTP 502', 'HTTP 503', 'HTTP 504'],
      correctOption: 'HTTP 502',
      marks: 5
    });

    // Q4: SJT
    await Question.create({
      examId: exam._id,
      questionText: 'The CEO calls you directly, extremely angry about the revenue loss, demanding you "just restart the servers immediately." How do you handle this?',
      type: 'sjt',
      options: [
        'Comply immediately and restart the servers to appease the CEO.',
        'Calmly explain that restarting while under a DDoS attack will just crash the servers again, and outline the mitigation plan.',
        'Ignore the call so you can focus on fixing the issue.',
        'Tell the CEO that this is out of your hands and blame the firewall vendor.'
      ],
      sjtScoring: {
        'Comply immediately and restart the servers to appease the CEO.': 0,
        'Calmly explain that restarting while under a DDoS attack will just crash the servers again, and outline the mitigation plan.': 15,
        'Ignore the call so you can focus on fixing the issue.': 5,
        'Tell the CEO that this is out of your hands and blame the firewall vendor.': 0
      },
      marks: 15
    });

    // Q5: MCQ
    await Question.create({
      examId: exam._id,
      questionText: 'Based on the scenario description (high requests from external IPs, 5000+ db connection pool size), what type of attack is most likely occurring?',
      type: 'mcq',
      options: ['SQL Injection', 'Cross-Site Scripting (XSS)', 'Distributed Denial of Service (DDoS)', 'Man-in-the-Middle (MitM)'],
      correctOption: 'Distributed Denial of Service (DDoS)',
      marks: 10
    });

    // Q6: MCQ
    await Question.create({
      examId: exam._id,
      questionText: 'To prevent future database connection pool exhaustion during a high-traffic event, which architectural pattern is best suited?',
      type: 'mcq',
      options: ['Implementing a message queue (e.g., RabbitMQ, Kafka) to buffer incoming orders.', 'Increasing the max connection limit on the database indefinitely.', 'Switching from PostgreSQL to MySQL.', 'Storing all checkout data in LocalStorage temporarily.'],
      correctOption: 'Implementing a message queue (e.g., RabbitMQ, Kafka) to buffer incoming orders.',
      marks: 10
    });

    // Q7: Ranking
    await Question.create({
      examId: exam._id,
      questionText: 'The incident is resolved. Rank the following Post-Mortem steps in the correct order:',
      type: 'ranking',
      options: [
        'Schedule a Blameless Post-Mortem meeting with all involved engineers.',
        'Implement the newly identified automated alerts and security patches.',
        'Draft an Incident Summary document detailing root cause, time to resolution, and impact.',
        'Publish a public Root Cause Analysis (RCA) to customers to rebuild trust.'
      ],
      correctOrder: [
        'Schedule a Blameless Post-Mortem meeting with all involved engineers.',
        'Draft an Incident Summary document detailing root cause, time to resolution, and impact.',
        'Implement the newly identified automated alerts and security patches.',
        'Publish a public Root Cause Analysis (RCA) to customers to rebuild trust.'
      ],
      marks: 15
    });

    // Q8: SJT
    await Question.create({
      examId: exam._id,
      questionText: 'During the post-mortem, you discover a junior developer pushed a firewall configuration change that bypassed rate-limiting, which let the DDoS attack through. How do you address this?',
      type: 'sjt',
      options: [
        'Reprimand the developer publicly to ensure no one makes the mistake again.',
        'Fire the developer for costing the company revenue.',
        'Acknowledge the mistake, but focus on fixing the CI/CD pipeline so unauthorized config changes require a senior review before deployment.',
        'Cover up the mistake so the developer doesn\'t get in trouble, and quietly fix the firewall.'
      ],
      sjtScoring: {
        'Reprimand the developer publicly to ensure no one makes the mistake again.': 0,
        'Fire the developer for costing the company revenue.': 0,
        'Acknowledge the mistake, but focus on fixing the CI/CD pipeline so unauthorized config changes require a senior review before deployment.': 20,
        'Cover up the mistake so the developer doesn\'t get in trouble, and quietly fix the firewall.': 5
      },
      marks: 20
    });

    console.log('Successfully seeded Scenario Exam and Questions!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedScenario();
