/**
 * EventQueue Class
 * 
 * Principle: First-In-First-Out (FIFO)
 * First-In-First-Out (FIFO) is a core principle of queue data structures.
 * In a collaborative whiteboard, stroke synchronization relies heavily on FIFO.
 * When multiple users draw simultaneously, their drawing events (strokes) 
 * are sent to the server. To maintain consistency and ensure everyone sees
 * the drawing in the exact order it was created, strokes must be broadcasted
 * and applied in the exact sequence they were received.
 * 
 * Preventing Race Conditions
 * Though JavaScript is single-threaded, asynchronous events (like multiple network
 * requests arriving almost at once) can cause unexpected order of execution if
 * not managed. A strict O(1) queue acts as a predictable, sequential pipeline.
 * Events are quickly placed in the queue in the exact order the event loop 
 * handles them, and processed sequentially, preventing race conditions where 
 * a later stroke might overwrite an earlier one.
 */
class EventQueue {
    constructor() {
        // Use a plain object to store items for O(1) access (prevents need for array shift)
        this.items = {};
        // Head pointer marks the start of the queue (next item to dequeue)
        this.head = 0;
        // Tail pointer marks the end of the queue (next available index to enqueue)
        this.tail = 0;
    }

    /**
     * Enqueue: Adds an item to the back of the queue.
     * 
     * Time Complexity: O(1) constant time
     * We simply assign the item to the current `tail` index in the object
     * and increment the `tail` pointer. No re-indexing is required.
     * 
     * @param {*} item - The drawing event or stroke data to add.
     */
    enqueue(item) {
        this.items[this.tail] = item;
        this.tail++;
    }

    /**
     * Dequeue: Removes and returns an item from the front of the queue.
     * 
     * Time Complexity: O(1) constant time
     * We retrieve the item at the `head` index, delete it from the object
     * (to free up memory), and increment the `head` pointer to point to the
     * next item. This acts as a true O(1) dequeue without shifting elements.
     * 
     * @returns {*} The item at the front of the queue, or undefined if empty.
     */
    dequeue() {
        if (this.isEmpty()) {
            return undefined;
        }
        
        const item = this.items[this.head];
        delete this.items[this.head];
        this.head++;
        return item;
    }

    /**
     * Peek: Returns the item at the front without removing it.
     * 
     * Use for DSA Dashboard:
     * `peek()` is highly useful for a Data Structures and Algorithms (DSA) dashboard.
     * It allows the UI to display the "Next Event to Process" without modifying the
     * queue's state or processing pipeline.
     * 
     * @returns {*} The item at the front, or undefined if empty.
     */
    peek() {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.items[this.head];
    }

    /**
     * isEmpty: Checks if the queue has any items.
     * 
     * @returns {boolean} True if the queue is empty, false otherwise.
     */
    isEmpty() {
        return this.size() === 0;
    }

    /**
     * Size: Returns the number of items currently in the queue.
     * 
     * Calculated by subtracting the head pointer from the tail pointer.
     * 
     * @returns {number} The current size of the queue.
     */
    size() {
        return this.tail - this.head;
    }

    /**
     * toArray: Converts the queue into an array representation.
     * 
     * Use for DSA Dashboard:
     * `toArray()` iterates through the active elements of the queue (from head to tail).
     * This is essential for rendering a visual representation of the entire queue
     * on a dashboard (e.g., drawing the queue blocks on the screen) so users 
     * can see the queue's live state and size at a glance.
     * 
     * @returns {Array} An array containing all queue items in FIFO order.
     */
    toArray() {
        const arr = [];
        for (let i = this.head; i < this.tail; i++) {
            arr.push(this.items[i]);
        }
        return arr;
    }
}

module.exports = EventQueue;