/**
 * Lightweight Priority Queue (min-heap)
 */
export default class MinHeap<T> {
  private heap: { key: number; value: T }[] = [];

  push(key: number, value: T) {
    this.heap.push({ key, value });
    this.bubbleUp();
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0].value;
    const end = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.bubbleDown();
    }
    return top;
  }

  private bubbleUp() {
    let i = this.heap.length - 1;
    const item = this.heap[i];
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].key <= item.key) break;
      this.heap[i] = this.heap[parent];
      i = parent;
    }
    this.heap[i] = item;
  }

  private bubbleDown() {
    let i = 0;
    const length = this.heap.length;
    const item = this.heap[0];
    while (true) {
      let left = 2 * i + 1;
      let right = 2 * i + 2;
      let smallest = i;
      if (left < length && this.heap[left].key < this.heap[smallest].key) smallest = left;
      if (right < length && this.heap[right].key < this.heap[smallest].key) smallest = right;
      if (smallest === i) break;
      this.heap[i] = this.heap[smallest];
      i = smallest;
    }
    this.heap[i] = item;
  }

  get size() {
    return this.heap.length;
  }
}