# Mock Test Platform Plan

## Overview
A secure, full-stack MERN online mock test platform with a server-synchronized anti-cheat timer and automated evaluation. Removes vulnerabilities like timer spoofing and guarantees fair evaluation.

## Project Type
WEB and BACKEND

## Success Criteria
- Timer accurately recalculates based on server absolute timestamp preventing timer spoofing and browser-refresh exploits.
- Exams auto-submit upon exact time expiry.
- Frontend and backend communicate securely using RESTful APIs and JWT.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Auth**: JWT

## System Architecture: Secure Timer Synchronization
To prevent client-side timer manipulation:
1. **Init**: On test start, backend generates `startTime` and calculates `endTime` based on test duration. These are saved in the `Session` document.
2. **Payload**: Frontend receives the `endTime` along with test questions.
3. **Sync**: The React frontend calculates remaining time using `endTime - Date.now()`. To prevent local system clock manipulation, the frontend periodically pings an `/api/time` endpoint or the initial server timestamp offset is calculated.
4. **Auto-Submit**: When time expires, frontend forces a submission. Even if the frontend is tampered with and blocked from auto-submitting, the backend strictly rejects any submission payload received after `endTime + grace period (e.g., 5 seconds)`.

## Folder Structure
```plaintext
mock-test-platform/
├── backend/
│   ├── src/
│   │   ├── config/        # Environment and DB config
│   │   ├── controllers/   # Route controllers
│   │   ├── middlewares/   # Auth and validation guards
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routes
│   │   ├── services/      # Business logic (evaluation, timer)
│   │   └── server.js      # Entry point
│   ├── .env
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/    # Reusable UI (Button, Timer)
│   │   ├── context/       # React Context (Auth, ExamSession)
│   │   ├── hooks/         # Custom hooks (useTimer, useAuth)
│   │   ├── pages/         # Page layouts (Login, Dashboard, Exam)
│   │   ├── services/      # API communication layer (Axios)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
└── mock-test-platform.md  # This project plan
```

## Database Schemas (Draft)

**User Schema**
- `_id`, `name`, `email`, `passwordHash`, `role` (Admin/Student), `createdAt`

**Exam Schema**
- `_id`, `title`, `description`, `durationMinutes`, `totalMarks`, `createdBy` (Admin ID), `isActive`

**Question Schema**
- `_id`, `examId` (Ref: Exam), `questionText`, `options` (Array of Strings), `correctOption` (String/Index), `marks`

**Session/Result Schema**
- `_id`, `userId` (Ref: User), `examId` (Ref: Exam), `status` (In-Progress, Completed, Auto-Submitted), `startTime`, `endTime` (Absolute timestamp limits), `answers` (Array of { questionId, selectedOption }), `score`, `submittedAt`

## Task Breakdown (Development Checklist)

1. **[ ] Database & Backend Init** (Agent: `backend-specialist`, Skill: `nodejs-best-practices`)
   - INPUT: MongoDB URI | OUTPUT: Express app with DB connection | VERIFY: API responds with 200 OK.
2. **[ ] Schema Implementation** (Agent: `database-architect`, Skill: `database-design`)
   - INPUT: Schema Drafts | OUTPUT: Mongoose models | VERIFY: CRUD functions successfully interact with local DB.
3. **[ ] Auth Layer** (Agent: `security-auditor`, Skill: `vulnerability-scanner`)
   - INPUT: User schema | OUTPUT: JWT Auth endpoints | VERIFY: Token returned on login, protected route blocked without it.
4. **[ ] Exam & Question APIs** (Agent: `backend-specialist`, Skill: `api-patterns`)
   - INPUT: Exam/Question schemas | OUTPUT: CRUD APIs | VERIFY: Admin can create exams/questions.
5. **[ ] Session & Timer Backend Logic** (Agent: `backend-specialist`, Skill: `api-patterns`)
   - INPUT: Session schema | OUTPUT: Start Exam & Submit Exam API. Strict `endTime` validation. | VERIFY: Submission rejected if sent after `endTime`.
6. **[ ] Frontend Init & Routing** (Agent: `frontend-specialist`, Skill: `react-best-practices`)
   - INPUT: React scaffolding | OUTPUT: React Router with protected routes | VERIFY: Unknown routes redirect, unauthenticated users sent to Login.
7. **[ ] Frontend Auth & Dashboard** (Agent: `frontend-specialist`, Skill: `frontend-design`)
   - INPUT: Auth API | OUTPUT: Login page, Admin/Student dashboards | VERIFY: Successful login redirects to correct dashboard.
8. **[ ] Exam Interface & Anti-Cheat Timer** (Agent: `frontend-specialist`, Skill: `react-best-practices`)
   - INPUT: Exam API | OUTPUT: Test-taking UI with synced countdown timer | VERIFY: Timer survives page refresh by fetching `endTime` from backend.
9. **[ ] Auto-Evaluation & Results** (Agent: `frontend-specialist`, Skill: `frontend-design`)
   - INPUT: Submit API | OUTPUT: Results view with score | VERIFY: Accurate score rendering based on backend validation.

## Phase X: Verification
- [ ] Lint & Type Check passed
- [ ] No critical security vulnerabilities
- [ ] Build Success
