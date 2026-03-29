# 🧪 Manual QA Testing Checklist

**Course:** Advanced Data Structures and Algorithm (ADSA)  
**Project:** Online Collaborative Whiteboard

Execute these manual tests to ensure the core Data Structures and WebSocket synchronizations are functioning seamlessly together.

| Test Case | Steps | Expected Result | Pass / Fail |
| :-------- | :---- | :-------------- | :---------- |
| **1. Single User Drawing** | 1. Open browser to the whiteboard page.<br>2. Click, hold, and drag the mouse across the canvas. | A continuous, unbroken stroke smoothly follows the cursor. No console errors occur. | `[ ]` |
| **2. Real-time Multi-User Sync** | 1. Open the whiteboard in Tab A (left) and Tab B (right).<br>2. Draw a shape in Tab A. | The exact stroke appears instantly in Tab B in real-time, matching coordinates and color perfectly. | `[ ]` |
| **3. Isolated Undo Execution** | 1. Tab A draws "Line A".<br>2. Tab B draws "Line B".<br>3. Tab A clicks the `Undo` button. | "Line A" disappears entirely from *both* Tab A and Tab B. "Line B" remains perfectly intact everywhere. | `[ ]` |
| **4. EventQueue (FIFO) Drain Rate** | 1. Watch the DSA Dashboard's Queue metric.<br>2. Click and draw a very long, rapid scribble. | The queue size metric spikes rapidly above `0` while drawing, but instantly drains back down to `0` when the mouse is released. | `[ ]` |
| **5. UndoStack (LIFO) Scaling** | 1. Watch the DSA Dashboard's Stack metric.<br>2. Draw 5 distinct strokes.<br>3. Click `Undo` two times. | The stack size correctly increments from `0` to `5`, then cleanly decrements down to `3` upon undoing twice. | `[ ]` |
| **6. Edge Case: Empty Undo** | 1. Open a fresh whiteboard with 0 strokes.<br>2. Repeatedly click the `Undo` button. | The application safely handles an empty stack pop. Nothing crashes, canvas stays blank, and no errors appear in the dev console. | `[ ]` |
| **7. Edge Case: Concurrent Rapid Drawing** | 1. Open Tab A and Tab B side-by-side.<br>2. Rapidly draw wildly in both tabs simultaneously. | Both screens remain perfectly synchronized. The EventQueue processes all strokes chronologically without dropping or duplicating coordinates. | `[ ]` |
| **8. Edge Case: Client Refresh** | 1. Draw 3 strokes locally.<br>2. Hard refresh the browser tab. | The React state unmounts cleanly. The canvas loads completely blank, and local UndoStack resets back to `0`. | `[ ]` |
