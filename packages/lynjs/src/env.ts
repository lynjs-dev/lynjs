/**
 * @module @lynjs/shared/env
 * 공용 환경 감지 유틸
 *
 * 지원되는 환경 감지 순서:
 * 1. __LYN_DEV__ / __LYN_PROD__ (DefinePlugin, vite define 등)
 * 2. import.meta.env.DEV / PROD (Vite, Astro)
 * 3. process.env.NODE_ENV (Webpack, Rollup, Esbuild, Node)
 * 4. 휴리스틱: localhost 등
 */

declare const __LYN_DEV__: boolean | undefined;
declare const __LYN_PROD__: boolean | undefined;

const meta = import.meta as unknown as { env?: { DEV?: boolean; PROD?: boolean; MODE?: string } };
const NODE_ENV = typeof process !== 'undefined' ? process?.env?.NODE_ENV : undefined;

export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
export const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
export const isTest = (NODE_ENV ?? '').toLowerCase() === 'test';

let devFlag: boolean | undefined = undefined;

// Custom user flags (__LYN_DEV__, __LYN_PROD__)
devFlag = typeof __LYN_DEV__ !== 'undefined' ? __LYN_DEV__ : undefined;
devFlag = devFlag ?? (typeof __LYN_PROD__ !== 'undefined' ? !__LYN_PROD__ : undefined);

// import.meta.env (Vite, Astro)
devFlag = devFlag ?? (meta?.env?.DEV !== undefined ? meta?.env?.DEV : undefined);
devFlag = devFlag ?? (meta?.env?.PROD !== undefined ? !meta?.env?.PROD : undefined);

// process.env.NODE_ENV
devFlag = devFlag ?? (NODE_ENV !== undefined ? NODE_ENV.toLowerCase() !== 'production' : undefined);

// The last heuristic (localhost)
devFlag = devFlag ?? (typeof location !== 'undefined' ? /localhost|127\.0\.0\.1/.test(location.hostname) : undefined);

// Default to production if unresolved
export const isDev: boolean = devFlag ?? false;
export const isProd: boolean = !isDev;

export const env = {
  isDev,
  isProd,
  isTest,
  isBrowser,
  isNode,
};

Object.freeze(env);
