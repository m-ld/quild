// PRed as: https://github.com/selfrefactor/rambda/pull/700

import { keys as keys_ } from "rambdax";

export function keys<T extends object>(x: T): Array<keyof T & string>;
export function keys<T>(x: T): string[];
export function keys<T>(x: T): string[] {
  return keys_(x);
}
