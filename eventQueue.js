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
        if (this.head === this.tail) return undefined;
        const item = this.items[this.head];
        delete this.items[this.head];
        this.head++;
        return item;
    }
}
module.exports = EventQueue;