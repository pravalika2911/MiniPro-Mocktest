# Sentinel Protocol - Online Mock Test Platform

A secure, full-stack MERN online assessment platform engineered to eliminate client-side vulnerabilities and ensure absolute exam integrity. Designed with a robust **Server-Synchronized Anti-Cheat Timer** and an uncompromising **Typographical Brutalist** aesthetic.

## 🚀 Core Feature: Server-Synchronized Anti-Cheat Timer
Conventional online examination platforms rely on inherently vulnerable client-side architectures, leaving them susceptible to "timer spoofing" (manipulating browser DOM, local system clocks, or refreshing the page to illegitimately extend exam durations).

**Sentinel Protocol neutralizes this via three layers of security:**
1. **Absolute Timestamp Boundaries:** The test `endTime` is calculated once on the Node.js backend when the session is initialized.
2. **Periodic Background Synchronization:** The React frontend constantly pings `/api/sessions/:id/sync` to pull the true server time and cross-reference it against the absolute expiry.
3. **Grace-Period Expiration Guards:** Even if the frontend UI is compromised and the automated `/submit` API payload is blocked, the server unconditionally rejects any submissions attempted beyond the explicit `endTime + 5 seconds` threshold, forcing a server-side auto-evaluation of previously saved drafts.

## ✨ Additional Features
- **Distraction-Free Brutalist Interface:** Sharp 2px geometries, striking `Azure Blue` & `Electric Purple` accents over deeply textured Slate/White canvases to evoke precision and authority.
- **Background Draft Auto-Save:** Answer selections are quietly sent to the server (`PUT /draft`) to ensure zero data loss in the event of hardware or internet failure.
- **Role-Based Access Control (RBAC):** Distinct roles for `Admin` (Exam/Question CRUD operations) and `Student` (Test takers). 
- **Automated Evaluation Engine:** Instant evaluation with zero manual intervention.
- **Granular Analytics UI:** Dynamic, visual representation of performance including pie charts (Correct vs Incorrect vs Omitted) generated via Recharts.

## 🛠️ Technology Stack
- **Frontend:** React.js, Vite, Tailwind CSS v4, React Router, Recharts, Lucide Icons
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ORM)
- **Authentication:** JSON Web Tokens (JWT) with Bcrypt Hashing

## Connect with MongoDB Compass
The backend is configured to connect to MongoDB Atlas. To connect Compass to the same cluster:
1. Install [MongoDB Compass](https://www.mongodb.com/try/download/compass).
2. Open `backend/.env` locally and copy the complete value of `MONGODB_URI`. Do not share or commit this value; it contains database credentials.
3. In Compass, choose **Add new connection**, paste the URI into the connection string field, and connect.
4. The current URI does not name a database explicitly, so Mongoose uses the `test` database by default. The backend `/api/status` response reports whether its database connection is active.

If Compass reports an IP/network error, add your current public IP to the Atlas project's **Network Access** allowlist. If it reports authentication failure, verify the Atlas database username/password in the URI and percent-encode special characters in the password. Never use the Atlas website login password as the database password.

## 📦 Getting Started
Ensure you have Node.js and MongoDB installed locally.

### 1. Backend Initialization
```bash
cd backend
npm install

# Optional: Seed the database with a dummy exam and test accounts
node seed.js

# Start the Express server
node server.js
```

### 2. Frontend Initialization
```bash
# In a new terminal window
cd frontend
npm install
npm run dev
```

### Password recovery email setup
Password recovery uses Gmail SMTP by default. Enable 2-Step Verification on the Gmail account, then create an **App Password** in Google Account → Security → App passwords. Use the generated App Password, not your normal Gmail password. Add these settings to `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-full-gmail-address@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=Sentinel Protocol <your-full-gmail-address@gmail.com>
CLIENT_URL=http://localhost:5173
```
Keep the App Password private and only in your local `backend/.env`; never commit or share it. Restart the backend after saving the settings. Google may not offer App Passwords for some managed/work accounts or accounts enrolled in Advanced Protection. Port `465` uses TLS; other ports use STARTTLS. The reset link expires after one hour and can only be used once.
The API never returns a reset token to the browser; the reset link is sent only to the registered account email. For production, set `CLIENT_URL` to the public frontend origin. SMTP credentials and MongoDB access are required; local development does not display or return a fallback reset link.

### 3. Test Accounts (If Seeded)
- **Administrator:** `admin@gmail.com` / `password123`
- **Candidate (Student):** `student1@gmail.com` / `password123`
- **Candidate (Student):** `student2@gmail.com` / `password123`

> Note: This application accepts only Gmail accounts for registration and login.

## Prepare for production deployment

1. For local development, use `NODE_ENV=development` and `CLIENT_URL=http://localhost:5173`. For production, copy the settings from `backend/.env.example` into protected environment secrets at your hosting provider. Never upload or commit `.env` files.
2. Set a production MongoDB Atlas `MONGODB_URI`, a unique random `JWT_SECRET` (at least 32 characters), `ADMIN_EMAIL`, and a strong `ADMIN_PASSWORD` (at least 12 characters). Configure `SMTP_USER` and `SMTP_PASS` with a Gmail App Password, plus `SMTP_FROM`.
3. Set `CLIENT_URL` to the exact public HTTPS origin of the frontend. For a same-origin deployment, leave `VITE_API_URL` unset and route `/api` and `/socket.io` to the backend. If frontend and backend use separate origins, set the frontend build variable `VITE_API_URL` to the backend URL ending in `/api`; set `CLIENT_URL` to the frontend origin.
4. Build the frontend with `cd frontend && npm ci && npm run build`. Install the backend with `cd backend && npm ci`, then run `npm start` at the host. The frontend build output is `frontend/dist`; configure the selected host or reverse proxy to serve it and forward `/api` plus `/socket.io` to the backend.
5. Verify the deployment's `/api/status`, admin login, an actual password-reset email, and reset-link expiry/use-once behavior before sharing the site.

Production startup fails when required security settings are missing. Production does not seed demo student accounts or allow login/registration while MongoDB is disconnected. On first production database initialization, untouched demo student accounts are removed, and the legacy admin with the known demo password is either upgraded to the configured `ADMIN_PASSWORD` or removed if `ADMIN_EMAIL` is different. Change the admin password through the recovery email flow afterward. The repository does not select or provision a hosting provider, domain, or cloud database; those must be configured in your hosting account.
