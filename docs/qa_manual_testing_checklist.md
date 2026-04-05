# Manual QA Testing Checklist

**Course:** Advanced Data Structures and Algorithm (ADSA)
**Project:** Online Collaborative Whiteboard

Execute these manual tests to ensure the core Data Structures and WebSocket synchronizations are functioning seamlessly together.

---

## Desktop Tests (Mouse)

| Test Case | Steps | Expected Result | Pass / Fail |
| :-------- | :---- | :-------------- | :---------- |
| **1. Single User Drawing** | 1. Open browser to the whiteboard page.<br>2. Click, hold, and drag the mouse across the canvas. | A continuous, unbroken stroke smoothly follows the cursor. No console errors occur. | `[ ]` |
| **2. Real-time Multi-User Sync** | 1. Open the whiteboard in Tab A (left) and Tab B (right).<br>2. Draw a shape in Tab A. | The exact stroke appears instantly in Tab B in real-time, matching coordinates and color perfectly. | `[ ]` |
| **3. Isolated Undo Execution** | 1. Tab A draws "Line A".<br>2. Tab B draws "Line B".<br>3. Tab A clicks the `Undo` button. | "Line A" disappears entirely from *both* Tab A and Tab B. "Line B" remains perfectly intact everywhere. | `[ ]` |
| **4. EventQueue (FIFO) Drain Rate** | 1. Watch the DSA Dashboard's Queue metric.<br>2. Click and draw a very long, rapid scribble. | The queue size metric spikes rapidly above `0` while drawing, but quickly drains back down to `0` when the mouse is released. | `[ ]` |
| **5. UndoStack (LIFO) Scaling** | 1. Watch the DSA Dashboard's Stack metric.<br>2. Draw 5 distinct strokes.<br>3. Click `Undo` two times. | The stack size correctly increments from `0` to `5`, then cleanly decrements down to `3` upon undoing twice. | `[ ]` |
| **6. Edge Case: Empty Undo** | 1. Open a fresh whiteboard with 0 strokes.<br>2. Repeatedly click the `Undo` button. | The application safely handles an empty stack pop. Nothing crashes, canvas stays blank, and no errors appear in the dev console. | `[ ]` |
| **7. Edge Case: Concurrent Rapid Drawing** | 1. Open Tab A and Tab B side-by-side.<br>2. Rapidly draw wildly in both tabs simultaneously. | Both screens remain perfectly synchronized. The EventQueue processes all strokes chronologically without dropping or duplicating coordinates. | `[ ]` |
| **8. Edge Case: Client Refresh** | 1. Draw 3 strokes locally.<br>2. Hard refresh the browser tab. | The React state unmounts cleanly. The canvas loads completely blank, and local UndoStack resets back to `0`. | `[ ]` |
| **9. Clear Board** | 1. Draw several strokes in Tab A and Tab B.<br>2. Click `Clear Board` in Tab A. | Both canvases are wiped clean. Stack and queue metrics reset to `0`. Activity log shows "cleared the board" entry. | `[ ]` |
| **10. Activity Log** | 1. Set a username in the input field.<br>2. Draw a stroke, undo it, then clear the board. | Each action appears in the activity log with the correct username, action text, and timestamp. Log auto-scrolls to the latest entry. | `[ ]` |

---

## Mobile & Touch Tests

| Test Case | Steps | Expected Result | Pass / Fail |
| :-------- | :---- | :-------------- | :---------- |
| **11. Touch Drawing** | 1. Open the whiteboard on a mobile device (or use DevTools mobile emulation).<br>2. Touch and drag on the canvas. | A smooth stroke follows the finger. Page does not scroll or zoom while drawing. | `[ ]` |
| **12. Responsive Layout** | 1. Open the whiteboard on a phone-sized viewport.<br>2. Observe the layout of canvas and activity log. | Canvas scales to fit the viewport width. Activity log wraps below the canvas on narrow screens. | `[ ]` |
| **13. Orientation Change** | 1. Draw a stroke in portrait mode.<br>2. Rotate the device to landscape. | The canvas resizes to fill the new width. Previously drawn strokes remain correctly rendered. | `[ ]` |
| **14. Multi-touch Non-interference** | 1. Place two fingers on the canvas simultaneously.<br>2. Draw with one finger. | Only one stroke is drawn. Pinch-zoom does not activate. | `[ ]` |

---

## Cross-Platform Tests

| Test Case | Steps | Expected Result | Pass / Fail |
| :-------- | :---- | :-------------- | :---------- |
| **15. Desktop + Mobile Sync** | 1. Open the whiteboard on a desktop browser.<br>2. Open the same URL on a phone.<br>3. Draw on the desktop. | The stroke appears on the mobile canvas in real-time, correctly scaled to the smaller viewport. | `[ ]` |
| **16. `/status` Endpoint** | 1. Open a new browser tab.<br>2. Visit the backend URL `/status`.<br>3. Draw on the whiteboard in another tab.<br>4. Refresh `/status`. | Returns JSON `{ "queueSize": <number> }`. Size increases during active drawing, returns to `0` when idle. | `[ ]` |
