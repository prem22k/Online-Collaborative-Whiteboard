# 🏛️ System Architecture & Data Flow

**Course:** Advanced Data Structures and Algorithm (ADSA)  
**Project:** Online Collaborative Whiteboard  

This document outlines the complete end-to-end data flow for the core interactions within the whiteboard system.

---

## 1. The "Draw a Stroke" Data Flow

When **User A** presses their mouse and moves it across the canvas, a sequence of coordinate points is generated.

```text
[ User A's Browser ]
       |
       | 1. capture (x, y) move events
       | 2. render stroke locally on Canvas
       | 3. bundle into 'draw_event' object
       v
  Socket.io Emit
  eventName: "draw_stroke"
  payload: { startX, startY, endX, endY, color, width, roomId }
```

---

## 2. Backend Processing (The EventQueue)

The Node.js backend receives concurrent drawing events from all users. To guarantee that every user's screen looks exactly the same, the server acts as the single source of truth and enforces a strict chronological order.

```text
[ Node.js Server / Backend ]
       |
       | 1. Socket receives "draw_stroke" from User A
       v
+-------------------------------------------------------+
|                 EventQueue (FIFO)                     |
|                                                       |
|  [Rear] <-- Event C <-- Event B <-- Event A <-- [Front|
|                                                       |
+-------------------------------------------------------+
       |
       | 2. Event is enqueued at the rear.
       | 3. The queue processing loop dequeues from the front.
       v
  Socket.io Broadcast
  eventName: "receive_stroke"
  room: User A's current roomId
```

*Note: The server stores the event temporarily in the queue just long enough to process it. Once broadcasted, the server removes it from the queue, preventing memory leaks.*

---

## 3. Receiving and Rendering (User B)

Meanwhile, **User B** sits in the same room. Their client listens for incoming socket events broadcasted by the server.

```text
[ User B's Browser ]
       |
       | 1. Socket listens for "receive_stroke"
       | 2. Extracts coordinates, color, and size
       v
+-------------------------------+
|    React Whiteboard Canvas    |
|                               |
| Context.lineTo(endX, endY)    |  <-- Render engine physically draws
| Context.stroke()              |      User A's stroke onto User B's screen
+-------------------------------+
       |
       | 3. User B's screen instantly reflects User A's actions 
       v
```

---

## 4. The Undo Operation (UndoStack)

What happens when **User A** makes a mistake and clicks `Undo`? We rely on our **LIFO Stack**.

```text
[ User A clicks "Undo" button ]
       |
       | 1. check if UndoStack.isEmpty() is false
       | 2. let strokeToUndo = UndoStack.pop()
       | 3. clear entire local Canvas
       | 4. redraw all remaining strokes from UndoStack (bottom to top)
       v
  Socket.io Emit
  eventName: "undo_action"
  payload: { userId, roomId }
       |
       |  Server receives "undo_action"
       |  Broadcasts to room: User B, User C
       v
[ User B & C Receive "undo_action" ]
       |
       | 1. Find User A's last stroke in global history
       | 2. Remove it
       | 3. Clear Canvas & Redraw remaining strokes
       v
```

---

## 5. The DSA Dashboard Data Lifecycle

As part of the ADSA project requirements, we expose the health and metrics of our underlying data structures.

**What the dashboard displays:**
1. **Queue Length (Live):** How many draw events are currently pending in the FIFO EventQueue.
2. **Current Queue Head:** A snapshot of the `.peek()` value.
3. **Stack Sizes:** The current depth of the local Undo/Redo Stacks.

**Where it gets data from:**
The dashboard relies on both local state (React) and a WebSocket stream from the Node.js server.

```text
[ Node.js / Express Server ]                   [ React DSA Dashboard ]
                                                          |
  1. Server sets interval (e.g. 500ms)                    |
  2. Measures EventQueue.size()     --------(Socket)----->| 3. Listens for "dsa_metrics"
  3. Measures total connected peers                       | 4. React setState updates UI
                                                          |
  (Frontend Only Data)                                    |
  5. Local useHistory Hook checks   --------------------->| 6. Shows Undo Stack Depth
     UndoStack.length                                     |
```
