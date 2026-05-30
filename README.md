# 🏥 DiagnoCenter – Full-Stack Management System

A complete web application for managing a diagnosis center — patients, doctors, reports, payments, and referral tracking.

---

## 📁 Project Structure

```
diagnocenter/
├── backend/          ← Node.js + Express + SQLite API
│   ├── server.js
│   ├── db.js
│   ├── .env
│   ├── package.json
│   └── routes/
│       ├── auth.js
│       ├── patients.js
│       ├── doctors.js
│       ├── reports.js
│       ├── payments.js
│       └── dashboard.js
└── frontend/         ← React web app
    ├── package.json
    └── src/
        ├── App.js
        └── index.js
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18 or higher (https://nodejs.org)

---

### Step 1 — Setup Backend

```bash
cd diagnocenter/backend
npm install
npm start
```

You should see:
```
✅ Default admin user created (admin / admin123)
✅ DiagnoCenter backend running at http://localhost:5000
```

> The SQLite database file `diagnocenter.db` is created automatically on first run.

---

### Step 2 — Setup Frontend (new terminal)

```bash
cd diagnocenter/frontend
npm install
npm start
```

Your browser will open at **http://localhost:3000**

---

## 🔐 Login

| Username | Password  |
|----------|-----------|
| admin    | admin123  |

---

## ✅ Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Today's patients, revenue, pending reports, top doctors |
| **Patients** | Register patients with test type, referring doctor, fee |
| **Doctors** | Add referring doctors, see total referral count live |
| **Reports** | Update report findings, impression, status per patient |
| **Payments** | Record payments (Cash/UPI/Card/Insurance), track dues |
| **Referral Analytics** | Leaderboard of doctors by patient count + revenue |

---

## 🗄️ Database

- Uses **SQLite** (file-based, no installation needed)
- Database file: `backend/diagnocenter.db`
- Auto-created on first run
- Tables: `users`, `patients`, `doctors`, `reports`, `payments`

---

## 🔧 Development Tips

- Backend runs on **port 5000**, frontend on **port 3000**
- The frontend `package.json` has `"proxy": "http://localhost:5000"` so API calls work seamlessly
- For auto-reload during development, install nodemon: `npm install -g nodemon` then use `npm run dev` in the backend folder

---

## 🔄 To Add More Staff Users

Use the register endpoint (from backend terminal or Postman):
```
POST http://localhost:5000/api/auth/register
{ "username": "staff1", "password": "pass123", "name": "Ramesh Kumar", "role": "staff" }
```

---

## 📦 For Production Deployment

1. Run `npm run build` in the frontend folder
2. Serve the `build/` folder with a static file server or Nginx
3. Change `JWT_SECRET` in `backend/.env` to a long random string
4. Use PM2 to keep the backend running: `pm2 start server.js`
