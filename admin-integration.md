# Task: Admin Dashboard Integration

## Objective
Replace mock data in the Admin Panel with live telemetry from the backend APIs to enable real-time proctoring overwatch.

## Sub-tasks
- [ ] Implement `useEffect` to fetch system metrics from `/api/admin/dashboard`.
- [ ] Map live metrics to Dashboard summary cards.
- [ ] Integrate real-time Violation Feed into the "Security Logs" and "Incident Log".
- [ ] Connect the "Question Bank" view to fetch actual exams from `/api/exams`.

## Verification Criteria
- [ ] Dashboard metrics match database counts (User, Exam, Session).
- [ ] Violations logged in a student session appear instantly in the Admin Feed.
- [ ] Admin can see the real names and emails of candidates instead of "recruit_99".
