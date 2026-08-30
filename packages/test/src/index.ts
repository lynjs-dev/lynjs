import hello from '@lynjs/core';

const actual = hello();
const expected = 'hello world';

if (actual !== expected) {
  throw new Error(`Expected ${JSON.stringify(expected)}, but received ${JSON.stringify(actual)}`);
}

console.log('✓ @lynjs/core hello() returns "hello world"');
