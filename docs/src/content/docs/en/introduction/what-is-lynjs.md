---
title: What is LynJS
---

## Overview

**LynJS** is a lightweight, fine-grained reactivity framework for building modern, standard-compliant Web Components and
reusable design systems.

Instead of relying on a virtual DOM or heavy abstractions, LynJS uses an efficient fine-grained reactivity model under
the hood, combined with native Custom Elements and Shadow DOM. This delivers precise, minimal updates and keeps runtime
overhead low.

You write components using familiar class-based patterns and clear decorators like `@attr` and `@watch`, making your
code easy to read, maintain, and reuse — ideal for scalable UI libraries.

LynJS lets you build Web Components that work seamlessly across different environments, without locking you into a
single frontend stack.

## Philosophy

LynJS is designed around three core principles that guide how it works and why it exists.

### Standards First

LynJS is built on native Web Components standards like Custom Elements, Shadow DOM, and Slots. By staying close to the
platform, it ensures broad compatibility with browsers and other tools, and keeps your components truly
framework-agnostic. This makes your UI reusable anywhere, from standalone pages to larger applications.

By leveraging these web standards, LynJS avoids the pitfalls of lock-in to any particular framework or ecosystem,
ensuring your components remain future-proof and interoperable. This approach also benefits from browser optimizations
and the growing ecosystem around Web Components.

### Fine-grained Efficiency

Instead of using a virtual DOM diffing system, LynJS uses a fine-grained reactivity model under the hood. This means
each piece of state tracks its own changes, so only the exact parts of your component that depend on that state will
update. The result is less work for the browser and faster interfaces with minimal runtime overhead.

This granular tracking allows LynJS to perform precise updates, avoiding unnecessary re-renders, and improving
performance, especially in complex UI scenarios. By minimizing the amount of work done during updates, LynJS helps
deliver smooth user experiences with lower memory and CPU usage.

### Declarative and Familiar

LynJS uses ES class syntax and decorators to make component logic explicit and easy to read. With decorators like
`@attr` for attributes and `@watch` for reacting to changes, you can declare behavior clearly, without writing manual
observers or wiring up boilerplate. This keeps your code maintainable, predictable, and easy for teams to share and
extend.

The declarative style aligns with modern JavaScript patterns, reducing cognitive overhead and making it easier to
onboard new developers. By providing clear, concise APIs for common tasks, LynJS helps you write robust components
faster while maintaining clarity and control over your component's behavior.

### Consistent and Quality Code by Design

LynJS is built with a focus on maintaining a consistent code structure and enforcing a baseline of code quality —
regardless of a developer's experience level. Whether you're a senior developer designing a large-scale design system or
a junior developer building your first component, LynJS encourages patterns that lead to clean, maintainable, and
predictable code.

Through its decorator-based API, structured mixin system, and automatic handling of attributes, events, and
accessibility properties, LynJS reduces the likelihood of human error and enforces best practices by default. This makes
code reviews easier, onboarding faster, and long-term maintenance more sustainable.

By limiting unnecessary flexibility and promoting convention over configuration, LynJS ensures that components look and
behave in a consistent way across a project or organization — empowering teams to move faster without sacrificing
quality.

## Key Features

LynJS includes a simple set of tools designed to make building Web Components straightforward and reliable.

- **LynElement:** A base class for defining custom elements with built-in lifecycle and reactivity.
- **Decorators:** Use `@attr` and `@state` for reactive properties linked to attributes, `@watch` for reacting to
  changes, and `@comp` for simple component composition.
- **Side Effect Utilities:** Functions like `connected`, `safeInterval`, and `safeTimeout` are intended to be used \*
  \*inside the `render` method only\*\* to manage side effects safely within the component’s lifecycle.
- **JSX Support:** Write templates declaratively using familiar JSX syntax.
- **Flexible and Extensible:** LynJS also provides other decorators and helpers — check the
  [Core API Reference](/docs/core-api/) for the full list.

## How It Works

LynJS works by combining the native power of Web Components with an internal fine-grained reactivity engine.

When you define a propertyDecorator with `@attr` or `@state`, LynJS automatically makes it reactive. Any part of your
template that uses these properties will automatically update when they change, without needing a full re-render.

Your component’s `render` method describes the initial structure using JSX. When the element is attached to the DOM,
LynJS tracks which parts of the DOM depend on which reactive properties. If a propertyDecorator changes, LynJS updates
only the affected parts efficiently.

Side effects like timers or custom behaviors can be declared inside the `render` method using `connected`,
`safeInterval`, or `safeTimeout`. These utilities ensure that side effects start when the component is connected and
clean up automatically when it disconnects.

### Technical Flow

Here’s a high-level look at how LynJS works under the hood:

1. **Declaration:** You extend `LynElement` and define reactive properties with `@attr`.
2. **Signal Setup:** Each `@attr` propertyDecorator is wrapped in an internal signal that tracks reads and writes.
3. **Render Phase:** The `render` method is called once when the component connects, producing the initial DOM using
   JSX.
4. **Dependency Tracking:** When the template uses reactive properties, LynJS tracks which parts of the DOM rely on
   which signals.
5. **Update:** When a propertyDecorator changes, only the exact parts that use it are re-executed and patched in the
   DOM.
6. **Watching:** Methods decorated with `@watch` run automatically when their target properties change.
7. **Side Effects:** Use `connected` and other helpers inside `render` to manage side effects safely.

This granular update model avoids unnecessary work and keeps your components performant and robust.

## Why Use LynJS

LynJS is a great choice if you want to build fast, modern Web Components with minimal overhead.

- **Framework Independence:** Components built with LynJS are standard Custom Elements, so they can run anywhere — no
  lock-in to a specific frontend stack.
- **High Performance:** Fine-grained reactivity updates only what’s needed, keeping your UI smooth and efficient.
- **Clear and Maintainable:** Class-based syntax and decorators make it easy to declare reactive state and side effects
  without boilerplate.
- **Safe Side Effects:** Lifecycle-aware helpers like `connected` and `safeInterval` make managing side effects
  predictable and reliable.
- **Perfect for Design Systems:** Slot, Shadow DOM, and standard attributes make LynJS ideal for building reusable UI
  libraries that scale across teams and projects.

## Basic Example

Below is a simple example of a LynJS component that shows how to declare reactive properties, handle side effects, and
render with JSX.

```tsx
import { LynElement, attr, state, element, safeInterval } from '@lynjs/core';

@element('my-counter')
export class MyCounter extends LynElement {
  @attr count = 0;
  @state running = true;

  render() {
    // SafeInterval automatically starts and organizes intervals according to the component life cycle.
    safeInterval(() => {
      if (this.running) this.count++;
    }, 1000);

    return (
      <button onClick={this.toggle}>
        Count: {this.count} ({this.running ? 'Pause' : 'Resume'})
      </button>
    );
  }

  protected toggle() {
    this.running = !this.running;
  }
}
```

In this example:

- Clicking the button toggles the counter between running and paused.
- `pause` stops the timer, `resume` restarts it.
- `connected` ensures the timer starts when connected and stops when disconnected.
