# 🛡️ Sentinel Protocol - Project Summary

## 🏷️ Branding & Identity
- **Project Name:** Sentinel Protocol
- **Tagline:** The Ultimate Integrity Protocol.
- **Aesthetic:** Brutalist / Cyberpunk / High-Tech (Indigo, Slate, Black).
- **Key Terms:** 
  - Candidate Node (Student Portal)
  - Command Center (Admin Portal)
  - Access Key (Password)
  - Handshaking (Auth Loading)

## 🔑 System Credentials (Test Accounts)
> **Note:** Requires running `node seed.js` in the backend folder first.

| Portal | User ID / Email | Access Key |
|--------|----------------|------------|
| **Admin Console** | `admin@sentinel.io` | `sentinel@2026` |
| **Candidate Node** | `candidate1@sentinel.io` | `sentinel@2026` |
| **Candidate Node 2** | `candidate2@sentinel.io` | `sentinel@2026` |

## 🛠️ Technical Implementation Status
- [x] **High-Range Security:** Helmet.js and Express-Rate-Limit integrated.
- [x] **Auth Stability:** Global interceptors handle 401/expired sessions.
- [x] **Registration:** Fixed data structure mismatch; auto-login enabled.
- [x] **Forgot Password:** UI Modal and API "Reset Sequence" logic implemented.
- [x] **Mock Test Organization:** Categories (enum) enforced at database level.
- [x] **Unique Mock Test:** `Sentinel_Cybersecurity_MockTest.csv` generated for bulk upload.

## 🚀 Launch Sequence (Manual Commands)
1. **Database:** `cd backend && node seed.js`
2. **Backend:** `cd backend && node server.js`
3. **Frontend:** `cd frontend && npm run dev`

---
*Created by Gemini Sentinel Agent - April 2026*
