// PRed as: https://github.com/selfrefactor/rambda/pull/699

import { prepend as prepend_ } from "rambdax";

/** `TSuper`, whenever `TSuper` is a supertype of `TSub`; otherwise `never`. */
type AsSuperType<TSub, TSuper> = TSub extends TSuper ? TSuper : never;

export function prepend<TElement>(x: TElement, input: TElement[]): TElement[];
export function prepend<TNewElement>(
  x: TNewElement
): <TElement>(input: Array<AsSuperType<TNewElement, TElement>>) => TElement[];

/* eslint-disable-next-line @typescript-eslint/no-explicit-any
   ---
   Doesn't matter for implementation */
export function prepend(x: any, obj?: any[]): any {
  return obj ? prepend_(x, obj) : prepend_(x);
}
