export type VariantAttributes = Record<string, string>;

export function normalizeAttributes(input: unknown): VariantAttributes {
  const obj = (input ?? {}) as Record<string, unknown>;
  const out: VariantAttributes = {};
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) {
      out[key.trim()] = v.trim();
    }
  }
  return out;
}

export function attributesKey(attrs: VariantAttributes) {
  const keys = Object.keys(attrs).sort((a, b) => a.localeCompare(b));
  return keys.map((k) => `${k}=${attrs[k]}`).join("|");
}

export function skuSafe(input: string) {
  return input
    .trim()
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/(^-|-$)/g, "");
}

export function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<T[][]>((acc, curr) => {
    const next: T[][] = [];
    for (const a of acc) {
      for (const c of curr) {
        next.push([...a, c]);
      }
    }
    return next;
  }, [[]]);
}
