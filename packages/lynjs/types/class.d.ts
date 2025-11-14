export type ConstructorClass<T = object> = new (...args: unknown[]) => T;
export type AbstractClass<T = object> = abstract new (...args: unknown[]) => T;
export type EventClass<E extends Event = Event, Init = unknown> = new (type: string, eventInitDict?: Init) => E;
export type Class<T = object> = ConstructorClass<T> | AbstractClass<T>;
