import { afterEach } from "vitest";
import { cleanup } from "./test-utils";

/**
 * 每个用例结束后清理 localStorage 与 Zustand 持久化副作用，
 * 避免跨用例污染（persist 会读写 localStorage）。
 */
afterEach(() => {
  cleanup();
});
