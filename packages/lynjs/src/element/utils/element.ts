import type { ControllerContext, HostContext } from '../types/element.d.ts';
import type { Class } from '../../../types/class.d.ts';
import { env } from '../../env.ts';

// Private symbol for host binding (not exported)
export const kBindHost = Symbol('lyn.bindHost');

// Shouldn't be exposed outside lynjs
export function setControllerHost(controller: ControllerContext, host: HostContext): void {
  // Bind host via private symbol-only API; prevents external assignment.
  (controller as unknown as Record<symbol, (host: HostContext) => void>)[kBindHost](host);
}

/**
 * Recursively iterates over all prototype members of a given class and its ancestor classes.
 *
 * @example
 * forEachPrototypeMember(SomeClass, (name, desc, owner) => {
 *   console.log(owner.name, name, desc);
 * });
 */
export function forEachPrototypeMember(
  owner: Class,
  callback: (name: string | symbol, desc: PropertyDescriptor, owner: Class) => void,
  seen: Set<string | symbol> = new Set(),
) {
  if (!owner || typeof owner !== 'function' || owner === Function.prototype) return;
  for (const key of Reflect.ownKeys(owner.prototype)) {
    const desc = Object.getOwnPropertyDescriptor(owner.prototype, key) as PropertyDescriptor;
    if (seen.has(key) || !desc) continue;
    seen.add(key);
    callback(key, desc, owner);
  }

  const superClass = Object.getPrototypeOf(owner);
  forEachPrototypeMember(superClass, callback, seen);
}

/**
 * Collects all prototype member names (including symbols) from the given class
 * and its entire inheritance chain, excluding `Object.prototype`.
 *
 * @param owner  The class whose prototype chain will be scanned.
 * @returns      A `Set` containing all unique member keys (string or symbol)
 *               defined on the class and its superclasses.
 */
export function getPrototypeMembers(owner: Class): Set<string | symbol> {
  const members = new Set<string | symbol>();
  forEachPrototypeMember(owner, (name) => {
    members.add(name);
  });
  return members;
}

/**
 * Defines prototype-level delegates that forward methods and properties
 * from one class (source) to another (target).
 *
 * This utility inspects the `sourceClass.prototype` and generates corresponding
 * delegating methods and accessors on `targetClass.prototype`. These delegates
 * forward calls and property access to the source instance returned by `getSource`.
 *
 * For example, you can delegate Host → Controller or Controller → Host, depending on context.
 *
 * @param targetClass  The class whose prototype will receive delegated members.
 * @param sourceClass  The class whose prototype will be scanned for members to delegate.
 * @param getSource    A function that, given a target instance, returns the corresponding source instance.
 * @param options      Configuration options:
 *                     - `exclude`: Member names to skip (e.g., ["constructor"]).
 * @returns            An object containing lists of delegated method and property names.
 */
export function definePrototypeDelegates<T>(
  targetClass: Class,
  sourceClass: Class,
  getSource: (self: T) => unknown,
  options: { exclude?: (string | symbol)[] } = {},
): { methods: (string | symbol)[]; properties: (string | symbol)[] } {
  const exclude = new Set(options.exclude ?? []);
  exclude.add('constructor');
  exclude.add('instanceof');

  const targetProto = targetClass.prototype;
  const targetMembers = getPrototypeMembers(targetClass);
  const delegatedMethods: (string | symbol)[] = [];
  const delegatedProperties: (string | symbol)[] = [];

  const defineMethod = (name: string | symbol, desc: PropertyDescriptor) => {
    Object.defineProperty(targetProto, name, {
      ...desc,
      value: function (...args: unknown[]): unknown {
        const source = getSource(this) as Record<string | symbol, unknown> | null;
        if (source == null) {
          throw new Error(`${sourceClass.name} is not bound - cannot call method ${String(name)}()`);
        }
        if (typeof source[name] !== 'function') {
          throw new TypeError(`${sourceClass.name} member ${String(name)} is not a function`);
        }
        return Reflect.apply(source[name], source, args);
      },
    });

    delegatedMethods.push(name);
  };

  const defineAccessor = (name: string | symbol, desc: PropertyDescriptor) => {
    Object.defineProperty(targetProto, name, {
      get: function (): unknown {
        const source = getSource(this) as Record<string | symbol, unknown> | null;
        if (source == null) return undefined;
        return Reflect.get(source as object, name);
      },
      set: function (value: unknown): void {
        const source = getSource(this) as Record<string, unknown> | null;
        if (source == null) {
          throw new Error(`${sourceClass.name} is not bound - cannot set property "${String(name)}".`);
        }

        if (desc.get && !desc.set) {
          throw new TypeError(
            `${sourceClass.name} property "${String(name)}" is read-only (getter only, no setter defined).`,
          );
        }

        if (!desc.get && desc.writable === false) {
          throw new TypeError(
            `${sourceClass.name} property "${String(name)}" is read-only (declared as non-writable).`,
          );
        }

        Reflect.set(source as object, name, value);
      },
      configurable: desc.configurable ?? true,
      enumerable: desc.enumerable ?? true,
    });
    delegatedProperties.push(name);
  };

  forEachPrototypeMember(sourceClass, (name, desc) => {
    if (exclude.has(name) || targetMembers.has(name)) return;

    const isMethod = typeof desc.value === 'function';
    const isAccessor = typeof desc.get === 'function' || typeof desc.set === 'function';
    const isDataProp = 'value' in desc && typeof desc.value !== 'function';

    if (env.isDev) desc = { ...desc, configurable: true };

    if (isMethod) {
      if (typeof name === 'string') defineMethod(name, desc);
    } else if (isAccessor || isDataProp) {
      if (typeof name === 'string') defineAccessor(name, desc);
    }
  });

  return { methods: delegatedMethods, properties: delegatedProperties };
}

export function defineInstanceDelegates(source: object, target: object) {
  const sourceMembers = new Set(Reflect.ownKeys(source));
  const targetMembers = new Set(Reflect.ownKeys(target));

  for (const name of sourceMembers) {
    const desc = Object.getOwnPropertyDescriptor(source, name);

    if (targetMembers.has(name)) continue;
    if (!desc || ('value' in desc && typeof desc.value === 'function')) continue;

    Object.defineProperty(target, name, {
      configurable: true,
      enumerable: desc.enumerable ?? true,
      get() {
        return Reflect.get(source, name);
      },
      set(value) {
        if ((desc.get && !desc.set) || ('writable' in desc && desc.writable === false)) {
          throw new TypeError(`${source.constructor.name} member ${String(name)} is not writable`);
        }
        Reflect.set(source, name, value);
      },
    });
  }
}
