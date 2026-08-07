/**
 * 测试公共工具。jsdom 提供 localStorage，这里集中清理，
 * 避免 Zustand persist 在用例间互相污染。
 */
export function cleanup() {
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.clear();
  }
}
