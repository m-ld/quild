// PRed as: https://github.com/selfrefactor/rambda/pull/695

import { anyPass as anyPass_ } from "rambdax";

/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
   ---
   Intentionally overriding the type of this function in favor of a better one. */
export const anyPass = anyPass_ as unknown as <T, U extends T[]>(predicates: {
  [K in keyof U]: (x: T) => x is U[K];
}) => (input: T) => input is U[number];
