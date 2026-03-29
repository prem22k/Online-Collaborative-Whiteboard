/**
 * UndoStack - A custom Stack implementation for managing Undo operations.
 * 
 * LIFO (Last-In, First-Out) Principle:
 * A stack operates on the LIFO principle, meaning the last item added to the stack 
 * is the first one to be removed. This is the correct choice for an undo system 
 * (like in a collaborative whiteboard) because when a user wants to undo an action, 
 * they expect their most recent stroke/action to be undone first.
 * 
 * Why Stack is better than a Queue for Undo:
 * A Queue uses FIFO (First-In, First-Out). If we used a Queue for undo, we would 
 * undo the very *first* stroke the user ever drew, which is counter-intuitive. 
 * We need to traverse operations backwards through time, making a Stack the 
 * perfect data structure.
 */
class UndoStack {
  constructor() {
    // Internal storage using a plain JavaScript array
    this.items = [];
    // Explicit top pointer integer to track the current top of the stack.
    // Initialized to -1 indicating an empty stack.
    this.top = -1;
  }

  /**
   * Pushes an item onto the top of the stack.
   * 
   * Time Complexity: O(1)
   * Why O(1)? We simply increment the top pointer and assign the value at that 
   * specific index in the array. No shifting of elements is required.
   * 
   * @param {*} item - The action or stroke to be added to the undo history.
   */
  push(item) {
    this.top += 1;
    this.items[this.top] = item;
  }

  /**
   * Removes and returns the item at the top of the stack.
   * 
   * Time Complexity: O(1)
   * Why O(1)? We just read the value at the current top index, and then 
   * decrement the top pointer. We don't need to reallocate the array immediately.
   * 
   * @returns {*} The most recently added item, or null if the stack is empty.
   */
  pop() {
    // Guard clause: What happens when pop() is called on an empty stack
    // If we try to undo when there's nothing to undo, we return null
    // to prevent errors and signal that the history is empty.
    if (this.isEmpty()) {
      return null;
    }

    const itemToPop = this.items[this.top];
    
    // Optional: we can clear the reference to help garbage collection, 
    // though decrementing the pointer effectively removes it from our view of the stack.
    this.items[this.top] = undefined; 

    // Decrement the top pointer
    this.top -= 1;

    return itemToPop;
  }

  /**
   * Returns the item at the top of the stack without removing it.
   * 
   * @returns {*} The most recently added item, or null if empty.
   */
  peek() {
    if (this.isEmpty()) {
      return null;
    }
    return this.items[this.top];
  }

  /**
   * Checks if the stack is empty.
   * 
   * @returns {boolean} True if the stack has no items, false otherwise.
   */
  isEmpty() {
    return this.top === -1;
  }

  /**
   * Returns the number of items currently in the stack.
   * 
   * @returns {number} The size of the stack.
   */
  size() {
    // Since top is a 0-based index (starting at -1), 
    // the size is always top + 1.
    return this.top + 1;
  }
}

export default UndoStack;
