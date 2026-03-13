# 💳 PayFlow — Real-Time Payment Tracking System

A full-stack MERN application that simulates a payment lifecycle system with real-time status updates, idempotent transactions, and a strict payment state machine. Built to explore real-world payment system challenges including idempotency, state machines, and real-time updates.

🔗 **Live Demo:** [payflow-sandy.vercel.app](https://payflow-sandy.vercel.app)  
🖥️ **Backend API:** [payflow-server-65f1.onrender.com](https://payflow-server-65f1.onrender.com/health)

---

## 🚀 Features

- **Real-Time Updates** — Payment status changes are pushed instantly to both sender and receiver via WebSocket rooms (Socket.io), with no polling or manual refresh required
- **Payment State Machine** — Payments follow a strict lifecycle: `initiated → processing → settled / failed`. Illegal transitions (e.g. `settled → processing`) are rejected at the server level
- **Idempotency** — Duplicate payment requests return a cached response. A unique idempotency key per request ensures no double charges, even under network retries
- **Optimistic Concurrency Control** — Each payment carries a `version` field. Status updates only succeed if the version matches, preventing lost updates under concurrent writes
- **JWT Auth with Refresh Token Rotation** — Access tokens expire in 15 minutes. Refresh tokens are stored hashed in the database and rotated on every use. Silent refresh via Axios interceptors means users are never logged out mid-session
- **Merchant Search** — Payers search recipients by name or email with debounced live search (300ms delay), rather than entering raw MongoDB IDs
- **Audit Trail** — Every status transition is recorded in an append-only `status_history` collection with timestamps and trigger source

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | React 18, Vite, Tailwind CSS        |
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB Atlas, Mongoose             |
| Real-Time  | Socket.io                           |
| Auth       | JWT, bcryptjs                       |
| Deployment | Vercel (frontend), Render (backend) |

---

## 📁 Project Structure

```
payflow/
├── client/                      # React Frontend (Vite)
│   ├── src/
│   │   ├── api/                 # Axios instances + API calls
│   │   ├── components/          # Reusable UI components
│   │   │   ├── common/          # Button, Badge, Loader
│   │   │   ├── layout/          # Navbar, ProtectedRoute
│   │   │   └── payments/        # PaymentCard, PaymentForm, StatusTimeline
│   │   ├── context/             # AuthContext, SocketContext
│   │   ├── hooks/               # useAuth, useSocket, usePayments
│   │   ├── pages/               # Login, Register, Dashboard, PaymentDetail
│   │   └── utils/               # statusColors
│   └── vercel.json              # SPA routing fix for Vercel
│
└── server/                      # Node.js + Express Backend
    └── src/
        ├── config/              # db.js, socket.js
        ├── controllers/         # auth.controller.js, payment.controller.js
        ├── middleware/          # authenticate.js, rateLimiter.js, errorHandler.js
        ├── models/              # User, Payment, StatusHistory, IdempotencyKey, Session
        ├── routes/              # auth.routes.js, payment.routes.js
        ├── services/            # stateMachine.js, idempotency.js, notifier.js
        └── utils/               # generateTokens.js, asyncWrapper.js
```

---

## 🧠 Core Engineering Concepts

### Payment State Machine

```
initiated → processing → settled
                      → failed
```

Implemented in `stateMachine.js` with an explicit transition table. Every status update goes through `transitionPayment()` which throws a `422` on illegal transitions. Terminal states (`settled`, `failed`) can never be updated.

### Idempotency

Every `POST /api/payments` request requires an `Idempotency-Key` header. The server checks the `idempotency_keys` collection before creating a payment. If the key exists, the cached response is returned immediately. Keys auto-expire after 24 hours via a MongoDB TTL index.

### Optimistic Concurrency Control

```js
// Only updates if version matches what we read
Payment.findOneAndUpdate(
  { _id: id, version: payment.version },
  { status: targetStatus, $inc: { version: 1 } },
);
```

If `rowsModified === 0`, a concurrent request won the race — respond with `409 Conflict` and ask the client to retry.

### WebSocket Rooms

Each payment has its own Socket.io room (`paymentId`). Each user has a personal room (`user:{userId}`). Status updates are emitted only to the relevant room — not broadcast to all connected clients. This is the production pattern for targeted delivery.

### Refresh Token Rotation

On every token refresh, the old refresh token is deleted and a new one is issued. Tokens are stored as bcrypt hashes, never in plaintext. Axios interceptors silently retry failed requests after refreshing — the user never sees a 401.

---

## 📡 API Reference

### Auth Routes

| Method | Endpoint                    | Auth | Description           |
| ------ | --------------------------- | ---- | --------------------- |
| POST   | `/api/auth/register`        | ❌   | Register new user     |
| POST   | `/api/auth/login`           | ❌   | Login, returns tokens |
| POST   | `/api/auth/refresh`         | ❌   | Rotate refresh token  |
| POST   | `/api/auth/logout`          | ✅   | Delete all sessions   |
| GET    | `/api/auth/me`              | ✅   | Get current user      |
| GET    | `/api/auth/users/search?q=` | ✅   | Search merchants      |

### Payment Routes

| Method | Endpoint                   | Auth | Description                 |
| ------ | -------------------------- | ---- | --------------------------- |
| POST   | `/api/payments`            | ✅   | Create payment (idempotent) |
| GET    | `/api/payments`            | ✅   | List all user payments      |
| GET    | `/api/payments/:id`        | ✅   | Get payment + history       |
| PATCH  | `/api/payments/:id/status` | ✅   | Transition payment status   |

---

## 🗄️ Database Schema

**5 Collections with purpose-driven indexes:**

- `users` — auth entity with bcrypt password hash
- `payments` — core entity with `version` for OCC and `idempotencyKey` unique index
- `status_history` — append-only audit trail, indexed by `paymentId + changedAt`
- `idempotency_keys` — TTL index auto-purges after 24 hours
- `sessions` — hashed refresh tokens with TTL auto-cleanup

---

## ⚙️ Local Setup

### Prerequisites

- Node.js v20+
- MongoDB Atlas account (free tier)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/payflow.git
cd payflow
```

### 2. Setup backend

```bash
cd server
npm install
```

Create `server/.env`:

```bash
PORT=8000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/payflow
ACCESS_TOKEN_SECRET=your_64char_secret
REFRESH_TOKEN_SECRET=your_different_64char_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

### 3. Setup frontend

```bash
cd ../client
npm install
```

Create `client/.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SOCKET_URL=http://localhost:8000
```

```bash
npm run dev
```

Open `http://localhost:5173`

---

## 🧪 Testing the Flow

1. Register two accounts — one as `payer`, one as `merchant`
2. Use separate browser windows (incognito for the second user)
3. Send a payment from payer to merchant
4. Watch merchant dashboard update in real-time without refresh
5. Open the payment detail in both tabs
6. Click "Mark Processing" — badge updates live in both tabs
7. Try sending the same payment twice (same idempotency key) — only one is created
8. Try updating a `settled` payment — server rejects with `422 Illegal transition`

---

## 👨‍💻 Author

Built by **Shashikiran Reddy** — 3rd year CSE student  
📧 shashikiranreddypagilla@gmail.com  
🔗 [LinkedIn](www.linkedin.com/in/shashikiran-reddy-pagilla) | [GitHub](https://github.com/shashi1349)
