/** Склейка CSS-классов: пустые значения (false, null, undefined) отбрасываются */
export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}
