class EventQueue {
    constructor() {
        this.items = {};
        this.head = 0;
        this.tail = 0;
    }

    enqueue(item) {
        this.items[this.tail] = item;
        this.tail++;
    }

    dequeue() {
        if (this.isEmpty()) return undefined;
        
        const item = this.items[this.head];
        delete this.items[this.head];
        this.head++;
        return item;
    }

    peek() {
        if (this.isEmpty()) return undefined;
        return this.items[this.head];
    }

    isEmpty() {
        return this.size() === 0;
    }

    size() {
        return this.tail - this.head;
    }

    toArray() {
        const arr = [];
        for (let i = this.head; i < this.tail; i++) {
            arr.push(this.items[i]);
        }
        return arr;
    }
}
module.exports = EventQueue;