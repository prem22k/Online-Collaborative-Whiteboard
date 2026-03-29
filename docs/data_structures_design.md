# 📘 Data Structures Design Document

**Course:** Advanced Data Structures and Algorithm (ADSA)  
**Project:** Online Collaborative Whiteboard  

---

## 1. EventQueue (Backend Event Handling)

### What it is
A **Queue** is a linear data structure that follows the **First-In-First-Out (FIFO)** principle. Elements are inserted at the rear (enqueue) and removed from the front (dequeue). Think of it like a line of people waiting to buy movie tickets — the first person in line is the first person served.

### Why it is the correct choice
In a real-time collaborative system, multiple users are sending drawing events (mouse moves, clicks) concurrently to the server. To maintain exact consistency across all clients, the server must process and broadcast these events in the **exact chronological order** they arrived. A Queue guarantees that an older event is always broadcast before a newer one, preserving the natural continuous flow of a drawn line.

### Internal Structure (Mermaid Diagram)

```mermaid
graph LR
    subgraph Incoming ["Concurrent Client Actions"]
        C1(Client User A)
        C2(Client User B)
        C3(Client User C)
    end

    subgraph EventQueue ["EventQueue (FIFO) Node.js"]
        direction LR
        Rear[Rear] --> E3[Event C<br/>Just Arrived] --> E2[Event B] --> E1[Event A<br/>Oldest] --> Front[Front]
    end

    Incoming -->|Socket 'draw_stroke'| Rear
    Front -->|Dequeue & Broadcast| WebSockets((WebSockets))
    WebSockets -->|'receive_stroke'| C1
    WebSockets -->|'receive_stroke'| C2
    WebSockets -->|'receive_stroke'| C3

    style EventQueue fill:#1f2937,stroke:#3b82f6,stroke-width:2px,color:#fff
    style Rear fill:#374151,stroke:#6b7280,color:#fff,stroke-dasharray: 5 5
    style Front fill:#374151,stroke:#6b7280,color:#fff,stroke-dasharray: 5 5
```

### Required Operations & Time Complexities
> [!NOTE]  
> For optimal O(1) performance in JS, this is typically implemented using a Linked List or a circular array, rather than `Array.shift()` which is O(N).

| Operation | Description | Time Complexity |
|-----------|-------------|-----------------|
| `enqueue(event)` | Adds a new drawing event to the rear of the queue | **O(1)** |
| `dequeue()` | Removes and returns the oldest event from the front | **O(1)** |
| `peek()` | Inspects the oldest event without removing it | **O(1)** |
| `isEmpty()` | Checks if there are pending events | **O(1)** |

### What would go wrong if we used the wrong data structure?
> [!CAUTION]  
> If we used a **Stack (LIFO)** instead of a Queue, the server would broadcast the *most recently* received event first. If a user quickly drew a line from point A to B to C, the events might arrive as A, B, C but be processed as C, B, A. Every user would see the line drawing itself backwards, creating chaotic and disconnected strokes on the canvas!

---

## 2. UndoStack (Frontend History Management)

### What it is
A **Stack** is a linear data structure that follows the **Last-In-First-Out (LIFO)** principle. Elements are added to the top (push) and removed from the top (pop). Think of it like a stack of cafeteria plates — you always take the top plate off, which was the last one put down.

### Why it is the correct choice
When a user presses "Undo" (`Ctrl+Z`), they expect to erase the very **last** thing they just drew. A Stack structurally enforces chronological rollback. Every time a user completes a stroke, it is pushed onto the top of the Stack. When they undo, we simply pop the top stroke off and revert the canvas to the state below it.

### Internal Structure (Mermaid Diagram)

```mermaid
graph BT
    subgraph ClientCanvas ["User Screen"]
        DrawAction("New Draw Action")
        UndoAction("Undo / Ctrl+Z")
    end

    subgraph UndoStack ["UndoStack (LIFO) React State"]
        direction BT
        Bottom["(Bottom Level)"] --> S1[Stroke 1<br/>Oldest] 
        S1 --> S2[Stroke 2] 
        S2 --> S3[Stroke 3] 
        S3 --> S4[Stroke 4<br/>Top Element]
        S4 --> Top["(Top Level)"]
    end

    DrawAction -->|Push action| Top
    Top -->|Pop action| UndoAction

    style UndoStack fill:#1f2937,stroke:#10b981,stroke-width:2px,color:#fff
    style Bottom fill:#374151,stroke:#6b7280,color:#fff,stroke-dasharray: 5 5
    style Top fill:#374151,stroke:#6b7280,color:#fff,stroke-dasharray: 5 5
```

### Required Operations & Time Complexities
> [!NOTE]  
> This is trivial to implement in JavaScript using native arrays, as `push()` and `pop()` are naturally optimized for this exact use case.

| Operation | Description | Time Complexity |
|-----------|-------------|-----------------|
| `push(stroke)` | Saves a completed stroke to the top of the history stack | **O(1)** |
| `pop()` | Removes and returns the most recent stroke to undo it | **O(1)** |
| `peek()` | Looks at the most recent action to determine UI state | **O(1)** |
| `isEmpty()` | Checks if undo state is empty (disables the Undo button) | **O(1)** |

### What would go wrong if we used the wrong data structure?
> [!CAUTION]  
> If we used a **Queue (FIFO)** instead of a Stack for history, pressing `Ctrl+Z` would delete the very **first thing** you ever drew on the canvas! If you spent an hour drawing a masterpiece and made one tiny mistake at the end, pressing Undo would suddenly wipe out the foundational sketch you did 60 minutes ago, while the mistake remained untouched.
