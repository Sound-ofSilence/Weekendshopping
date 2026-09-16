/** 过滤掉值为 undefined 的字段，返回仅含已定义字段的对象（用于 Prisma update data）。 */
export function pickDefined<T extends object>(obj: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}
