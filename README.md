# Online Collaborative Whiteboard

> A real-time, multi-user collaborative whiteboard built as a university **Advanced Data Structures and Algorithm (ADSA)** course project.

---

## Project Description

The Online Collaborative Whiteboard allows multiple users to draw on a shared canvas in real time. Built on the **HTML5 Canvas API**, the application uses **WebSockets (Socket.io)** for low-latency event broadcasting and integrates core DSA concepts:

- **Queue (FIFO)** — server-side event ordering for consistent stroke synchronization
- **Stack (LIFO)** — client-side undo/redo for drawing operations

A live **Queue/Stack dashboard** is rendered on the UI so you can observe both data structures in action. The canvas is **mobile-responsive** — supports touch drawing on phones and tablets with adaptive layout.

---

## Live Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | _your-vercel-app-url_ |
| Backend | Render | _your-render-app-url_ |

> Open the frontend URL in two browser tabs to simulate multi-user collaboration.

---

## Team Members & Roles

| Member | Details | Role | Responsibilities |
|--------|---------|------|-----------------|
| **Member 1** | Mythri (23311a04l8, ECE)<br> GitHub: [@mythri105](https://github.com/mythri105) | Backend Developer | Node.js server, Socket.io event system, EventQueue implementation |
| **Member 2** | Sanjana (23311a04k4, ECE)<br> GitHub: [@sanjanan0507](https://github.com/sanjanan0507) | Frontend Developer | React components, HTML5 Canvas drawing logic, UI/UX |
| **Member 3** | Prem Sai K (23311A04L9, ECE)<br> GitHub: [@prem22k](https://github.com/prem22k) | Integration Engineer | Frontend-backend integration, end-to-end testing, deployment |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React.js | Component-based UI framework |
| Vite | Build tool and dev server |
| HTML5 Canvas API | Core drawing surface |
| Socket.io Client | Real-time WebSocket communication |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | JavaScript runtime |
| Express.js | HTTP server and REST endpoint (`/status`) |
| Socket.io | Bi-directional WebSocket communication |

---

## Project Structure

```
Online-Collaborative-Whiteboard/
│
├── client/                          # React Frontend (Vite)
│   ├── index.html                   # HTML entry point (Vite root)
│   ├── vite.config.js               # Vite configuration + dev proxy
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas.jsx           # Main drawing canvas with Undo stack
│   │   │   └── ActivityLog.jsx      # Real-time activity log panel
│   │   ├── hooks/
│   │   │   ├── useSocket.js         # Socket.io connection + event listeners
│   │   │   └── useStatusPolling.js  # Polls /status for live queue size
│   │   ├── utils/
│   │   │   ├── UndoStack.js         # Client-side Stack (LIFO) implementation
│   │   │   └── constants.js         # Server URL from env with fallback
│   │   ├── App.jsx                  # Root component
│   │   └── main.jsx                 # React entry point
│   └── package.json
│
├── server/                          # Node.js Backend
│   ├── src/
│   │   ├── utils/
│   │   │   └── EventQueue.js        # Server-side Queue (FIFO) implementation
│   │   └── index.js                 # Express + Socket.io server entry point
│   └── package.json
│
├── docs/                            # Documentation & assets
│   ├── data_structures_design.md    # DSA design docs with diagrams
│   ├── architecture_data_flow.md    # System architecture and data flow
│   └── qa_manual_testing_checklist.md
│
├── dsa.test.js                      # Unit tests for EventQueue and UndoStack
├── .gitignore
└── README.md
```

---

## How to Run Locally

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/prem22k/Online-Collaborative-Whiteboard.git
cd Online-Collaborative-Whiteboard
```

### 2. Run the Backend (Server)

```bash
cd server
npm install

# Set environment variables
export PORT=5000
export CLIENT_URL=http://localhost:3000

npm run dev
```

> The backend will be running at **http://localhost:5000**

### 3. Run the Frontend (Client)

Open a **new terminal tab/window**:

```bash
cd client
npm install

# Set the backend URL (optional — defaults to http://localhost:5000)
export VITE_BACKEND_URL=http://localhost:5000

npm run dev
```

> The frontend will be running at **http://localhost:3000**

### 4. Open the App

Navigate to **http://localhost:3000** in two separate browser tabs to simulate multi-user collaboration.

---

## Core DSA Concepts Used

### Queue — Server-Side Event Processing

**Location:** `server/src/utils/EventQueue.js`

**Why a Queue?**
When multiple users draw simultaneously, their stroke events arrive at the server asynchronously. A FIFO queue ensures events are broadcast in the **exact order received**, preventing race conditions and maintaining canvas consistency across all clients.

- **Data Structure:** FIFO Queue using an object with head/tail pointers (O(1) enqueue and dequeue)
- **Usage:** All incoming `draw` Socket.io events are enqueued. A 16ms interval worker loop (approx 60fps) dequeues and broadcasts events one at a time.
- **Operations Used:** `enqueue()`, `dequeue()`, `peek()`, `isEmpty()`, `size()`, `toArray()`

```
User A draws → [enqueue] → Queue: [A_stroke, B_stroke] → [dequeue at ~60fps] → broadcast
User B draws → [enqueue] ↗
```

The live queue size is displayed in the UI dashboard and polled via `GET /status`.

---

### Stack — Client-Side Undo

**Location:** `client/src/utils/UndoStack.js` and `client/src/components/Canvas.jsx`

**Why a Stack?**
Undo requires accessing the **most recent action first** — a classic Last-In, First-Out (LIFO) pattern. Each completed stroke is pushed onto the stack. Pressing Ctrl+Z pops the top stroke ID and removes all its segments from the canvas.

- **Data Structure:** Stack backed by a native JavaScript array
- **Usage:** On `mouseup`, the stroke ID is pushed onto the stack. Undo pops it, filters out matching segments, and redraws the canvas.
- **Operations Used:** `push()`, `pop()`, `peek()`, `isEmpty()`, `size()`

```
Stroke A → push(A) → Stack: [A]
Stroke B → push(B) → Stack: [A, B]
Ctrl+Z   → pop()   → Stack: [A]   → removes B segments → redraw
```

The live stack size is displayed in the UI dashboard.

---

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `draw` | Client → Server → Broadcast | Stroke segment data (strokeId, coordinates, color, width) |
| `undo` | Client → Server → Broadcast | Undo request with target stroke ID |
| `clear` | Client → Server → Broadcast | Clear entire canvas |
| `activity` | Client → Server → Broadcast | User activity entry (user, action, timestamp) |

---

## REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check — confirms server is running |
| `/status` | GET | Returns `{ queueSize: <number> }` for the live dashboard |

---

## Mobile Responsiveness

The whiteboard works on phones and tablets:

- **Touch input** — `touchstart`, `touchmove`, `touchend` handlers with coordinate mapping for accurate drawing
- **Responsive canvas** — scales to screen width while maintaining aspect ratio, resizes on orientation change
- **Adaptive layout** — canvas and activity log stack vertically on narrow screens (`flex-wrap`)
- **Touch optimizations** — `touch-action: none` prevents scroll interference, `overscroll-behavior: none` blocks pull-to-refresh, 44px minimum tap targets
- **High-DPI support** — canvas internal resolution scales with `devicePixelRatio` for crisp rendering on Retina/HiDPI screens

---

## Day-Wise Development Plan

| Day | Phase | Goals |
|-----|-------|-------|
| **Day 1** | Design | Finalize UI wireframes, system architecture, Socket.io event schema, DSA module interfaces |
| **Day 2** | Logic | Implement backend (Express + Socket.io, EventQueue, worker loop), unit tests for DSA utilities |
| **Day 3** | UI | Build React frontend (Canvas, ActivityLog, hooks for socket + status polling), connect to live backend |
| **Day 4** | Testing | Multi-user testing, bug fixes, deployment to Vercel + Render, final README |

---

## Environment Variables Reference

### Backend (`server`)
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `CLIENT_URL` | `http://localhost:3000` | CORS origin for the frontend |

### Frontend (`client`)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_BACKEND_URL` | `http://localhost:5000` | Backend server URL |

---

## License

This project is developed for academic purposes as part of a university ADSA course.

---

*Built for learning — Advanced Data Structures and Algorithm (ADSA), Sreenidhi Institute Of Science and Technology, 2026*
