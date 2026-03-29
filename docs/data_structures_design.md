# 📘 Data Structures Design Document

**Course:** Advanced Data Structures and Algorithm (ADSA)  
**Project:** Online Collaborative Whiteboard  

---

## 1. EventQueue (Backend Event Handling)

### What it is
A **Queue** is a linear data structure that follows the **First-In-First-Out (FIFO)** principle. Elements are inserted at the rear (enqueue) and removed from the front (dequeue). Think of it like a line of people waiting to buy movie tickets — the first person in line is the first person served.

### Why it is the correct choice
In a real-time collaborative system, multiple users are sending drawing events (mouse moves, clicks) concurrently to the server. To maintain exact consistency across all clients, the server must process and broadcast these events in the **exact chronological order** they arrived. A Queue guarantees that an older event is always broadcast before a newer one, preserving the natural continuous flow of a drawn line.

### Internal Structure (ASCII Diagram)
```text
      Incoming Drawing Events from Clients
                 |  |  |
                 v  v  v
             +---+--+--+---+
Rear/Tail -> | E | D | C |   <-- (Just arrived)
             +---+--+--+---+
             | B           |
             +-------------+
             | A           |   <-- (Front/Head - oldest event)
             +-------------+
                 |   |
                 v   v
             Processed and Broadcasted across WebSockets
```

### Required Operations & Time Complexities
*Note: For optimal O(1) performance in JS, this is typically implemented using a Linked List or a circular array, rather than `Array.shift()` which is O(N).*

| Operation | Description | Time Complexity |
|-----------|-------------|-----------------|
| `enqueue(event)` | Adds a new drawing event to the rear of the queue | **O(1)** |
| `dequeue()` | Removes and returns the oldest event from the front | **O(1)** |
| `peek()` | Inspects the oldest event without removing it | **O(1)** |
| `isEmpty()` | Checks if there are pending events | **O(1)** |

### What would go wrong if we used the wrong data structure?
If we used a **Stack (LIFO)** instead of a Queue, the server would broadcast the *most recently* received event first. If a user quickly drew a line from point A to B to C, the events might arrive as A, B, C but be processed as C, B, A. Every user would see the line drawing itself backwards, creating chaotic and disconnected strokes on the canvas!

---

## 2. UndoStack (Frontend History Management)

### What it is
A **Stack** is a linear data structure that follows the **Last-In-First-Out (LIFO)** principle. Elements are added to the top (push) and removed from the top (pop). Think of it like a stack of cafeteria plates — you always take the top plate off, which was the last one put down.

### Why it is the correct choice
When a user presses "Undo" (`Ctrl+Z`), they expect to erase the very **last** thing they just drew. A Stack structurally enforces chronological rollback. Every time a user completes a stroke, it is pushed onto the top of the Stack. When they undo, we simply pop the top stroke off and revert the canvas to the state below it.

### Internal Structure (ASCII Diagram)
```text
            (Push / Pop happens ONLY at the top)
                            ^   |
                      Pop() |   | Push()
                            |   v
                      +---------------+
            Top ----> | Stroke 4      |  <-- Most recent action
                      +---------------+
                      | Stroke 3      |
                      +---------------+
                      | Stroke 2      |
                      +---------------+
         Bottom ----> | Stroke 1      |  <-- Oldest action
                      +---------------+
```

### Required Operations & Time Complexities
*Note: This is trivial to implement in JavaScript using native arrays, as `push()` and `pop()` are naturally optimized for this exact use case.*

| Operation | Description | Time Complexity |
|-----------|-------------|-----------------|
| `push(stroke)` | Saves a completed stroke to the top of the history stack | **O(1)** |
| `pop()` | Removes and returns the most recent stroke to undo it | **O(1)** |
| `peek()` | Looks at the most recent action to determine UI state | **O(1)** |
| `isEmpty()` | Checks if undo state is empty (disables the Undo button) | **O(1)** |

### What would go wrong if we used the wrong data structure?
If we used a **Queue (FIFO)** instead of a Stack for history, pressing `Ctrl+Z` would delete the very **first thing** you ever drew on the canvas! If you spent an hour drawing a masterpiece and made one tiny mistake at the end, pressing Undo would suddenly wipe out the foundational sketch you did 60 minutes ago, while the mistake remained untouched.
