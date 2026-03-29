# 🖊️ Online Collaborative Whiteboard

> A real-time, multi-user collaborative whiteboard built as a university **Advanced Data Structures and Algorithm (ADSA)** course project.

---

## 📖 Project Description

The Online Collaborative Whiteboard allows multiple users to draw, annotate, and collaborate on a shared canvas in real time. Built on top of the **HTML5 Canvas API**, the application leverages **WebSockets (Socket.io)** for low-latency event broadcasting and integrates core DSA concepts — such as **Queues** for event ordering and **Stacks** for undo/redo operations — to ensure a smooth and predictable user experience.

---

## 👥 Team Members & Roles

| Member | Details | Role | Responsibilities |
|--------|---------|------|-----------------|
| **Member 1** | Mythri (23311a04l8, ECE)<br> GitHub: [@mythri105](https://github.com/mythri105) | Backend Developer | Node.js server, Socket.io event system, API routes, session management |
| **Member 2** | Sanjana (23311a04k4, ECE) | Frontend Developer | React components, HTML5 Canvas drawing logic, UI/UX design |
| **Member 3** | Prem Sai K (23311A04L9, ECE)<br> GitHub: [@prem22k](https://github.com/prem22k) | Integration Engineer | Connecting frontend ↔ backend, end-to-end testing, deployment |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React.js | Component-based UI framework |
| HTML5 Canvas API | Core drawing surface |
| Socket.io Client | Real-time event subscription |
| CSS3 | Styling and layout |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | JavaScript runtime |
| Express.js | HTTP server and REST API |
| Socket.io | Bi-directional WebSocket communication |

---

## 📁 Project Structure

```
Online-Collaborative-Whiteboard/
│
├── client/                          # React Frontend
│   ├── public/
│   │   └── index.html               # HTML entry point
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Canvas.jsx           # Main drawing canvas component
│   │   │   ├── Toolbar.jsx          # Drawing tools (pen, eraser, shapes)
│   │   │   ├── ColorPicker.jsx      # Color selection panel
│   │   │   └── UserPresence.jsx     # Active users indicator
│   │   ├── context/
│   │   │   └── WhiteboardContext.jsx # Global state (tool, color, history)
│   │   ├── hooks/
│   │   │   ├── useCanvas.js         # Canvas drawing logic hook
│   │   │   ├── useSocket.js         # Socket.io connection hook
│   │   │   └── useHistory.js        # Undo/Redo Stack hook
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing / room selection page
│   │   │   └── Whiteboard.jsx       # Main whiteboard page
│   │   ├── utils/
│   │   │   ├── canvasHelpers.js     # Drawing math utilities
│   │   │   └── eventQueue.js        # Client-side event Queue implementation
│   │   ├── styles/
│   │   │   └── index.css            # Global styles
│   │   ├── App.jsx                  # Root component with routing
│   │   └── main.jsx                 # React entry point
│   ├── .env.example                 # Frontend environment variables template
│   └── package.json
│
├── server/                          # Node.js Backend
│   ├── src/
│   │   ├── controllers/
│   │   │   └── roomController.js    # Room create/join/leave logic
│   │   ├── events/
│   │   │   ├── drawingEvents.js     # Socket drawing event handlers
│   │   │   └── roomEvents.js        # Socket room lifecycle handlers
│   │   ├── middleware/
│   │   │   └── errorHandler.js      # Global error middleware
│   │   ├── models/
│   │   │   └── Room.js              # In-memory room model
│   │   ├── routes/
│   │   │   └── roomRoutes.js        # REST API routes (/api/rooms)
│   │   ├── utils/
│   │   │   ├── EventQueue.js        # Server-side Queue (FIFO event processing)
│   │   │   └── UndoStack.js         # Server-side Stack (undo/redo per session)
│   │   └── index.js                 # Express + Socket.io server entry point
│   ├── .env.example                 # Backend environment variables template
│   └── package.json
│
├── docs/                            # Documentation & assets
│   ├── architecture.md              # System design diagrams
│   └── api.md                       # REST + Socket event reference
│
├── .gitignore
└── README.md
```

---

## ⚙️ How to Run Locally

### Prerequisites
- **Node.js** v18 or higher
- **npm** v9 or higher
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/Online-Collaborative-Whiteboard.git
cd Online-Collaborative-Whiteboard
```

---

### 2. Run the Backend (Server)

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env and set PORT (default: 5000) and any required variables

# Start the development server
npm run dev
```

> The backend will be running at **http://localhost:5000**

---

### 3. Run the Frontend (Client)

Open a **new terminal tab/window**:

```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Set REACT_APP_SOCKET_URL=http://localhost:5000

# Start the React development server
npm start
```

> The frontend will be running at **http://localhost:3000**

---

### 4. Open the App

Navigate to **http://localhost:3000** in two separate browser tabs to simulate multi-user collaboration.

---

## 🧠 Core DSA Concepts Used

### 📋 Queue — Event Handling

**Location:** `server/src/utils/EventQueue.js` and `client/src/utils/eventQueue.js`

**Why a Queue?**
Drawing is an inherently sequential operation. When multiple users draw simultaneously, their events must be processed in the **exact order they were received** to maintain canvas consistency across all clients.

- **Data Structure:** FIFO (First-In, First-Out) Queue
- **Usage:** All incoming Socket.io drawing events are enqueued on the server before being broadcast. This prevents race conditions and ensures every client renders strokes in the same global order.
- **Operations Used:** `enqueue()`, `dequeue()`, `isEmpty()`, `peek()`

```
User A draws stroke → [enqueue] → Queue: [A_stroke, B_stroke, C_stroke] → [dequeue one by one] → Broadcast
User B draws stroke → [enqueue] ↗
User C draws stroke → [enqueue] ↗
```

---

### 📚 Stack — Undo / Redo

**Location:** `server/src/utils/UndoStack.js` and `client/src/hooks/useHistory.js`

**Why a Stack?**
Undo/redo requires accessing the **most recent action first** — a classic Last-In, First-Out (LIFO) pattern.

- **Data Structure:** Two Stacks — `undoStack` and `redoStack`
- **Usage:** Every drawing action is pushed onto the `undoStack`. When the user presses Ctrl+Z, the top item is popped from `undoStack` and pushed onto `redoStack`. Ctrl+Y reverses this.
- **Operations Used:** `push()`, `pop()`, `peek()`, `isEmpty()`

```
Action A → push(A) → undoStack: [A]
Action B → push(B) → undoStack: [A, B]
Ctrl+Z   → pop()   → undoStack: [A]   redoStack: [B]
Ctrl+Y   → pop()   → undoStack: [A, B] redoStack: []
```

---

## 📅 Day-Wise Development Plan

| Day | Phase | Goals |
|-----|-------|-------|
| **Day 1** | 🎨 Design | Finalize UI wireframes, system architecture diagram, Socket.io event schema, REST API contract, and DSA module interfaces |
| **Day 2** | ⚙️ Logic | Implement backend (Express server, Socket.io setup, EventQueue, UndoStack, room management), write unit-level tests for DSA utilities |
| **Day 3** | 🖥️ UI | Build React frontend (Canvas component, Toolbar, hooks for socket + history), connect to live backend, validate real-time sync |
| **Day 4** | 🧪 Testing | End-to-end multi-user testing, bug fixes, performance review, final README polish, and project demo preparation |

---

## 📌 Environment Variables Reference

### Backend (`server/.env`)
```
PORT=5000
NODE_ENV=development
```

### Frontend (`client/.env`)
```
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 📄 License

This project is developed for academic purposes as part of a university ADSA course.

---

*Built with ❤️ for learning — Advanced Data Structures and Algorithm (ADSA), [University Name], 2026*
