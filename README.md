# 💜 ForShe — Private Chat App

A premium private 2-person messenger for **vinoth** and **ishwarya** only.
Built with React + Vite + Tailwind CSS (frontend) and Node.js + Express + Socket.IO + SQLite (backend).

---

## 📁 Project Structure

```
ForShe/
├── backend/
│   ├── src/
│   │   ├── middleware/auth.js      # JWT middleware
│   │   ├── routes/auth.js          # Login route
│   │   ├── routes/messages.js      # Messages + image upload
│   │   ├── socket/handlers.js      # Socket.IO events
│   │   ├── database.js             # SQLite (node:sqlite built-in)
│   │   └── server.js               # Express + Socket.IO server
│   ├── uploads/                    # Uploaded images (local storage)
│   ├── data/                       # forshe.db (auto-created)
│   ├── .env                        # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx            # Main chat screen
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── MessageBubble.jsx   # Chat bubble
│   │   │   ├── TypingIndicator.jsx # Typing dots
│   │   │   └── ConnectionStatus.jsx
│   │   ├── context/AuthContext.jsx # JWT auth state
│   │   ├── hooks/useSocket.js      # Socket.IO hook
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js **v22+** (uses built-in `node:sqlite`)
- npm

### 1. Backend

```bash
cd backend
cp .env.example .env        # Edit passwords & JWT secret before first run
npm install
npm run dev                  # Development with nodemon
# or
npm start                    # Production
```

Backend runs on **http://localhost:4000**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                  # Development server
# or
npm run build && npm run preview  # Production preview
```

Frontend runs on **http://localhost:5173**

---

## 🔐 Default Credentials

> **Change these in `backend/.env` before first run!**

| User     | Default Password  |
|----------|-------------------|
| vinoth   | `Vinoth@123`      |
| ishwarya | `Ishwarya@123`    |

Accounts are created automatically on first server start.
**No registration endpoint exists** — any other login attempt is rejected.

---

## ⚙️ Environment Variables

### `backend/.env`

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173

# Change in production!
JWT_SECRET=forshe_super_secret_jwt_key_change_in_production_2024

# Passwords used only on first DB seed
VINOTH_PASSWORD=Vinoth@123
ISHWARYA_PASSWORD=Ishwarya@123
```

### `frontend/.env`

```env
# Leave empty for local dev (Vite proxy handles it)
VITE_API_URL=
VITE_SOCKET_URL=

# For production (point to your backend URL):
# VITE_API_URL=https://your-backend.onrender.com
# VITE_SOCKET_URL=https://your-backend.onrender.com
```

---

## 🌐 Deployment

### Frontend → Vercel

1. Push the `frontend/` folder to GitHub (or monorepo root)
2. In Vercel:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   VITE_SOCKET_URL=https://your-backend.onrender.com
   ```
4. Deploy ✅

### Backend → Render

1. Create a new **Web Service** on Render
2. Connect your GitHub repo
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Node Version:** 22 (set in environment)
4. Add environment variables:
   ```
   PORT=4000
   CLIENT_ORIGIN=https://your-frontend.vercel.app
   JWT_SECRET=<generate a strong random secret>
   VINOTH_PASSWORD=<your chosen password>
   ISHWARYA_PASSWORD=<your chosen password>
   ```
5. Deploy ✅

### 📦 SQLite on Render — Important Notes

- Render's free tier uses **ephemeral disk** — the SQLite database resets on each deploy/restart.
- For persistent storage on Render, add a **Persistent Disk** mount at `/data` and set:
  ```
  # In server code, DB_PATH uses /data/forshe.db automatically
  ```
  OR upgrade to a paid Render plan with persistent disk.
- Alternatively, migrate to [Turso](https://turso.tech) (LibSQL, free tier) for persistent serverless SQLite.

### Uploaded Images on Render

- Images in `uploads/` are also ephemeral on free tier.
- For production image storage, use **Cloudinary** or **AWS S3** and update the upload route.

---

## ✨ Features

- 🔒 Private — only 2 accounts, no registration
- ⚡ Real-time messaging via Socket.IO WebSockets  
- 💜 Beautiful dark theme with smooth animations
- 📱 Mobile responsive
- 🖼️ Image sharing (up to 10MB)
- ✍️ Typing indicators
- 🟢 Online/offline status
- 📜 Full message history on login
- 🔐 JWT auth persisted in localStorage
- 🛡️ Helmet, CORS, input validation, bcrypt