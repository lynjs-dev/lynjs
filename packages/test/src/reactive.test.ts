import { describe, expect, it, vi } from 'vitest';
import { connected, createEffect, effect, onCleanup, root, signal } from '@lynjs/core/rxcore';

describe('signal', () => {
  it('effect가 읽은 Signal이 변경되면 effect를 다시 실행한다', () => {
    const count = signal(0);
    const observer = vi.fn(() => count.value);

    effect(observer);
    count.value = 1;

    expect(observer).toHaveBeenNthCalledWith(1, undefined);
    expect(observer).toHaveBeenNthCalledWith(2, 0);
  });

  it('Signal에 같은 값을 쓰면 effect를 다시 실행하지 않는다', () => {
    const count = signal(0);
    const observer = vi.fn(() => count.value);

    effect(observer);
    count.value = 0;

    expect(observer).toHaveBeenCalledOnce();
  });

  it('effect를 다시 실행할 때 사용하지 않는 Signal의 구독을 제거한다', () => {
    const enabled = signal(true);
    const first = signal('first');
    const second = signal('second');
    const observer = vi.fn(() => (enabled.value ? first.value : second.value));

    effect(observer);
    enabled.value = false;
    first.value = 'ignored';
    second.value = 'updated';

    expect(observer).toHaveBeenCalledTimes(3);
    expect(observer).toHaveLastReturnedWith('updated');
  });

  it('effect를 다시 실행하기 전에 이전 cleanup을 실행한다', () => {
    const count = signal(0);
    const cleanup = vi.fn();

    createEffect(() => {
      void count.value;
      onCleanup(cleanup);
    });
    count.value = 1;

    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('root disposer가 effect와 Signal 구독을 정리한다', () => {
    const count = signal(0);
    const observer = vi.fn(() => count.value);
    const cleanup = vi.fn();
    let dispose = () => {};

    root((disposer) => {
      dispose = disposer;
      createEffect(() => {
        observer();
        onCleanup(cleanup);
      });
    });

    count.value = 1;
    dispose();
    count.value = 2;

    expect(observer).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it('root를 시작하고 정리할 때 연결 생명주기를 실행한다', () => {
    const onConnect = vi.fn();
    const onDisconnect = vi.fn();
    let dispose = () => {};

    root((disposer) => {
      dispose = disposer;
      connected(() => {
        onConnect();
        return onDisconnect;
      });
    });

    expect(onConnect).toHaveBeenCalledOnce();
    expect(onDisconnect).not.toHaveBeenCalled();

    dispose();

    expect(onDisconnect).toHaveBeenCalledOnce();
  });
});
