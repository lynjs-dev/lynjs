/**
 * metaclass - decorators:
 * @element - define a custom element
 * @state - define a reactive state
 * @persist - define a persistent(storage) attribute
 * @attr - define a reactive attribute
 * @ref - define a ref
 * @event - define an event listener
 * @asTag - define a dynamic element tag
 * @effect - define a reactive effect
 * @memo - define a memo
 * @fetch - define a fetch
 */

export type ConstructorClass<T = object> = new (...args: unknown[]) => T;
export type AbstractClass<T = object> = abstract new (...args: unknown[]) => T;
export type EventClass<E extends Event = Event, Init = unknown> = new (type: string, eventInitDict?: Init) => E;
export type Class<T = object> = ConstructorClass<T> | AbstractClass<T>;

export type Forward = string | (() => string);

export interface AttributeConverter<T = unknown> {
  fromString(value: string): T;
  toString(value: T): string;
}

export type AttributeType =
  | AttributeConverter
  | typeof String
  | typeof Number
  | typeof Boolean
  | typeof Number
  | typeof BigInt
  | typeof JSON
  | typeof Set
  | typeof Array
  | typeof Map
  | typeof Symbol
  | typeof Date
  | Class
  | null
  | unknown;

export type EventDecoratorDescriptor<E extends EventClass = EventClass> = {
  name: string;
  bubbles?: boolean;
  composed?: boolean;
  cancelable?: boolean;
  bind?: {
    target?: Forward;
    trigger?: string;
  };
  type?: E;
  property?: PropertyDecoratorDescriptor;
};

export type AttributeDecoratorDescriptor = {
  name?: string;
  target?: Forward;
  readonly?: boolean;
  initonly?: boolean;
  reflect?: boolean;
  type?: AttributeType;
  property?: PropertyDecoratorDescriptor;
  separated?: boolean;
  persist?: boolean;
};

type PropertyDecoratorDescriptor = {
  name?: string;
  state?: boolean;
  readonly?: boolean;
  persist?: boolean;
  attribute?: AttributeDecoratorDescriptor;
  define?: (constructor: Class, option: PropertyDecoratorDescriptor, ...args: unknown[]) => void;
  event?: EventDecoratorDescriptor;
};

type PropertyDecoratorOption = PropertyDecoratorDescriptor & {};

type PropertyDecoratorMetadata = {
  option: PropertyDecoratorOption;
  context: DecoratorContext;
};

export const PropertyMetadataKey = Symbol('PropertyMetadata');
export const AttributeMetadataKey = Symbol('AttributeMetadata');
export const EventMetadataKey = Symbol('EventMetadata');

function getDecoratorMetadata<T>(context: DecoratorContext, key: string): T[] {
  const metadata = ((context.metadata as DecoratorMetadataObject)[key] as T[]) ?? [];
  (context.metadata as DecoratorMetadataObject)[key] = metadata;
  return metadata;
}

export function metaclass(constructor: Class, context: ClassDecoratorContext) {
  console.log(constructor, context);
}

export function element(name: string, options?: ElementDefinitionOptions) {
  return (constructor: CustomElementConstructor, context: ClassDecoratorContext) => {
    metaclass(constructor, context);
    if (typeof customElements == 'undefined') return;

    // At this point, the class body is fully defined, but
    // Babel/TypeScript will attach static fields and methods *after* this decorator runs.
    // If you register the element here, the constructor may be called
    // before static fields/methods are available, leading to runtime bugs.
    // To ensure all statics are bound, defer registration with queueMicrotask.
    queueMicrotask(() => customElements.define(name, constructor, options));
  };
}

export function property(option?: PropertyDecoratorOption) {
  return (_: unknown, context: ClassFieldDecoratorContext) => {
    const properties = getDecoratorMetadata<PropertyDecoratorMetadata>(context, 'properties');

    option = {
      ...option,
      attribute: option?.attribute ? { ...option.attribute, property: option } : undefined,
      event: option?.event ? { ...option.event, property: option } : undefined,
    } as PropertyDecoratorOption;

    properties.push({ option: option, context });
  };
}
