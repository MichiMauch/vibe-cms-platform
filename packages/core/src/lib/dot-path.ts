export function setByPath(obj: Record<string, unknown>, dotPath: string, value: unknown): void {
  const keys = dotPath.split(".");
  let cur: Record<string, unknown> | unknown[] = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const idx = /^\d+$/.test(k) ? Number(k) : k;
    const next = (cur as Record<string | number, unknown>)[idx as keyof typeof cur];
    if (next === undefined || next === null) {
      throw new Error(`Path segment "${k}" missing in dotPath "${dotPath}"`);
    }
    cur = next as Record<string, unknown> | unknown[];
  }
  const last = keys[keys.length - 1];
  const lastKey = /^\d+$/.test(last) ? Number(last) : last;
  (cur as Record<string | number, unknown>)[lastKey] = value;
}
