// dsa.test.js

// Assuming the classes are in the same directory or easily referenced. 
// Update the require paths if they are nested!
let EventQueue, UndoStack;
try {
  EventQueue = require('./eventQueue');
  UndoStack = require('./undoStack');
} catch (e) {
  console.warn("⚠️  Mocking classes for demonstration since require() failed. Please ensure eventQueue.js and undoStack.js are present.");
  
  // Minimal mocks just so the file runs if the real classes aren't linked yet.
  EventQueue = class { enqueue(){} dequeue(){} peek(){} isEmpty(){} size(){} toArray(){} };
  UndoStack = class { push(){} pop(){} peek(){} isEmpty(){} size(){} };
}

// Custom assertion wrapper to label and print PASS/FAIL clearly
function test(description, executeTest) {
  try {
    const passed = executeTest();
    if (passed !== false) {
      console.log(`✅  PASS  | ${description}`);
    } else {
      console.error(`❌  FAIL  | ${description}`);
    }
  } catch (error) {
    console.error(`❌  FAIL  | ${description} \n     Error: ${error.message}`);
  }
}

console.log("=========================================");
console.log("       DATA STRUCTURES TEST SUITE        ");
console.log("=========================================\n");


// ------------------------------------------------------------------
// 1. EventQueue Tests (FIFO)
// ------------------------------------------------------------------
console.log("🟢 Testing EventQueue (FIFO)...");

test("EventQueue: isEmpty returns true on empty queue", () => {
  const q = new EventQueue();
  return q.isEmpty() === true;
});

test("EventQueue: Enqueue 3 items, check size is 3", () => {
  const q = new EventQueue();
  q.enqueue({ event: 'draw1' });
  q.enqueue({ event: 'draw2' });
  q.enqueue({ event: 'draw3' });
  return q.size() === 3;
});

test("EventQueue: peek does not remove item", () => {
  const q = new EventQueue();
  q.enqueue('A');
  const top = q.peek();
  return top === 'A' && q.size() === 1;
});

test("EventQueue: Dequeue returns items in FIFO order", () => {
  const q = new EventQueue();
  q.enqueue('First');
  q.enqueue('Second');
  q.enqueue('Third');
  
  const a = q.dequeue();
  const b = q.dequeue();
  const c = q.dequeue();
  
  return a === 'First' && b === 'Second' && c === 'Third' && q.size() === 0;
});

test("EventQueue: dequeue on empty queue returns null safely", () => {
  const q = new EventQueue();
  const result = q.dequeue();
  return result === null && q.size() === 0;
});


// ------------------------------------------------------------------
// 2. UndoStack Tests (LIFO)
// ------------------------------------------------------------------
console.log("\n🔵 Testing UndoStack (LIFO)...");

test("UndoStack: isEmpty returns true on empty stack", () => {
  const stack = new UndoStack();
  return stack.isEmpty() === true;
});

test("UndoStack: Push 3 items, check size is 3", () => {
  const stack = new UndoStack();
  stack.push({ strokeId: 1 });
  stack.push({ strokeId: 2 });
  stack.push({ strokeId: 3 });
  return stack.size() === 3;
});

test("UndoStack: peek does not remove item", () => {
  const stack = new UndoStack();
  stack.push('Bottom');
  stack.push('Top');
  const topItem = stack.peek();
  return topItem === 'Top' && stack.size() === 2;
});

test("UndoStack: Pop returns items in LIFO order", () => {
  const stack = new UndoStack();
  stack.push('First');
  stack.push('Second');
  stack.push('Third');
  
  const a = stack.pop();
  const b = stack.pop();
  const c = stack.pop();
  
  return a === 'Third' && b === 'Second' && c === 'First' && stack.size() === 0;
});

test("UndoStack: Pop on empty stack returns null safely", () => {
  const stack = new UndoStack();
  const result = stack.pop();
  return result === null && stack.size() === 0;
});

console.log("\n=========================================");
console.log("              TESTS FINISHED             ");
console.log("=========================================");
