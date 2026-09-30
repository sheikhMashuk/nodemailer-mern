# Nodemailer MERN Contact Form

A tiny beginner project. A visitor fills in a React form; the Express server saves the message in MongoDB and uses **Nodemailer** to email it to you.

```
React form ──POST /api/send-email──▶ Express server ──▶ MongoDB   (saves the message)
                                                    └──▶ Nodemailer ──▶ Gmail (sends the email)
```

It also has a simple **login** and **forgot password** flow:

```
Register / Login ──▶ bcrypt checks the password ──▶ JWT token (kept in localStorage)

Forgot password ──▶ random token saved (hashed, 15 min) ──▶ Nodemailer emails
                    http://localhost:5173/?resetToken=...  ──▶ user picks a new password
```

| Route | Body | What it does |
|---|---|---|
| `POST /api/auth/register` | `name, email, password` | Creates the account and logs in |
| `POST /api/auth/login` | `email, password` | Returns `{ token, user }` |
| `POST /api/auth/forgot-password` | `email` | Emails a reset link |
| `POST /api/auth/reset-password/:token` | `password` | Sets the new password (link works once) |

## Folder structure

```
nodemailer/
├── backend/
│   ├── server.js          ← Express server (the main file)
│   ├── routes/auth.js     ← register, login, forgot + reset password
│   ├── models/Message.js  ← MongoDB schema for contact messages
│   ├── models/User.js     ← MongoDB schema for accounts
│   ├── config/mailer.js   ← Nodemailer (Gmail) setup
│   └── .env.example       ← copy to .env and fill in
└── frontend/
    └── src/
        ├── App.jsx        ← picks which page to show
        └── pages/         ← Login, Register, ForgotPassword, ResetPassword, ContactForm
```

## Setup

### 1. Get a Gmail App Password
Gmail will not let apps log in with your normal password.

1. Turn on 2-Step Verification: https://myaccount.google.com/security
2. Open https://myaccount.google.com/apppasswords and create a password named `nodemailer`
3. Copy the 16 letters (without spaces)

### 2. Get MongoDB running
- **Local:** install [MongoDB Community Server](https://www.mongodb.com/try/download/community) and keep "Install as a Service" ticked. The default `MONGO_URI` in `.env.example` then works as-is.
- **Cloud:** create a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster and paste its connection string into `MONGO_URI`.

### 3. Get your Cloudinary keys (for the optional image upload)
1. Sign up at https://cloudinary.com
2. Dashboard → **Go to API Keys**. Copy the Cloud name, API Key and API Secret into `CLOUDINARY_*` in `.env`

How the image upload works:
```
React (FormData) ──▶ multer (keeps file in memory) ──▶ Cloudinary ──▶ image URL
                                                         saved in MongoDB + added to the email
```
The Cloudinary code is in `backend/config/cloudinary.js`.

### 4. Start the backend
```
cd backend
copy .env.example .env
```
Open `.env` and set `EMAIL_USER` (your Gmail), `EMAIL_PASS` (the App Password) and `JWT_SECRET` (any long random string). Then:
```
npm install
npm run dev
```
You should see:
```
Server running at http://localhost:5000
MongoDB connected
Email login OK
```

### 5. Start the frontend (in a second terminal)
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173, create an account, then fill in the form and press **Send**. The email arrives in your own inbox.

To try **Forgot password**: log out, click *Forgot password?*, enter your account's email, and open the link in the email you receive.

## Deploy to Vercel

The backend and frontend are deployed as **two separate Vercel projects** from the same GitHub repo.

```
https://your-frontend.vercel.app ──fetch──▶ https://your-backend.vercel.app ──▶ MongoDB Atlas, Gmail, Cloudinary
```

### 0. Before you start
- **MongoDB must be Atlas** (Vercel can't reach MongoDB on your computer).
- In Atlas → **Security → Network Access**, add `0.0.0.0/0`. Vercel's servers don't have a fixed IP, so "My current IP" is not enough.
- Push this folder to a GitHub repo (`.gitignore` already keeps `.env` and `node_modules` out).

### 1. Backend
1. https://vercel.com/new → import the repo.
2. **Root Directory:** `backend`. Vercel detects Express by itself (it uses `server.js`, which exports the app).
3. **Environment Variables:** add everything from `backend/.env` except `PORT`. (Tip: you can paste the whole `.env` file into the first *Key* box.)
   Set `CLIENT_URL` to a placeholder for now; you'll fix it in step 3.
4. Deploy, then open the backend URL. You should see `{"status":"ok"}`.

### 2. Frontend
1. https://vercel.com/new → import the **same** repo again.
2. **Root Directory:** `frontend`. Vercel detects Vite by itself.
3. **Environment Variables:** `VITE_API_URL` = your backend URL, e.g. `https://your-backend.vercel.app` (no `/` at the end).
4. Deploy.

### 3. Connect them
In the **backend** project → Settings → Environment Variables, set `CLIENT_URL` to your frontend URL (e.g. `https://your-frontend.vercel.app`), then **Redeploy**. This is the link that the "forgot password" email points to.

> `VITE_API_URL` is baked in when the frontend is built. If you change it, redeploy the frontend.

## Troubleshooting

| Message | Cause |
|---|---|
| `Email login FAILED: Invalid login (535)` | Wrong `EMAIL_USER`, or `EMAIL_PASS` is not an App Password |
| `MongoDB connection FAILED: ECONNREFUSED` | MongoDB is not running |
| `Failed to fetch` in the browser | The backend is not running on port 5000 (on Vercel: `VITE_API_URL` is wrong or missing - fix it and redeploy the frontend) |
| Email does not show up | Check your Spam folder |
| `Must supply api_key` / `Invalid Signature` | Wrong or missing `CLOUDINARY_*` values in `.env` |
| `File too large` | Images must be under 4 MB |
| `Could not connect to the database` | MongoDB is not running, or (Atlas) your IP is not in **Network Access** |
| `secretOrPrivateKey must have a value` | `JWT_SECRET` is missing in `.env` |
| `Reset link is invalid or has expired` | The link is older than 15 minutes or was already used - ask for a new one |
