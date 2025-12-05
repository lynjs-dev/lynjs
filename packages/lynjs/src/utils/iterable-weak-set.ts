export interface IterableWeakSetLike<T extends object> extends Iterable<T> {
  add(value: T): this;
  delete(value: T): boolean;
  has(value: T): boolean;
  forEach(cb: (value: T) => void): void;
  readonly sizeApproximate: number;
}

export class IterableWeakSet<T extends object> implements IterableWeakSetLike<T> {
  #has = new WeakSet<T>();
  #refs = new Set<WeakRef<T>>();
  #reg = new FinalizationRegistry<WeakRef<T>>((ref) => this.#refs.delete(ref));

  add(value: T): this {
    if (this.#has.has(value)) return this;
    const ref = new WeakRef(value);
    this.#refs.add(ref);
    this.#has.add(value);
    this.#reg.register(value, ref, ref);
    return this;
  }

  delete(value: T): boolean {
    if (!this.#has.delete(value)) return false;
    for (const ref of this.#refs) {
      if (ref.deref() === value) {
        this.#refs.delete(ref);
        this.#reg.unregister(ref);
        break;
      }
    }
    return true;
  }

  has(value: T) {
    return this.#has.has(value);
  }

  forEach(callback: (value: T) => void) {
    for (const ref of this.#refs) {
      const o = ref.deref();
      if (o) callback(o);
      else this.#refs.delete(ref);
    }
  }

  *[Symbol.iterator]() {
    for (const ref of this.#refs) {
      const o = ref.deref();
      if (o) yield o;
      else this.#refs.delete(ref);
    }
  }

  get sizeApproximate() {
    let n = 0;
    for (const _ of this) n++;
    return n;
  }
}

export default IterableWeakSet;
