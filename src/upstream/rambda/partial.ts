// PRed as: https://github.com/selfrefactor/rambda/pull/701

import { partial as partial_ } from "rambdax";

export const partial: <
  Args extends unknown[],
  ArgsGiven extends [...Partial<Args>],
  R
>(
  fn: (...args: Args) => R,
  ...args: ArgsGiven
) => Args extends [
  ...{ [K in keyof ArgsGiven]: K extends keyof Args ? Args[K] : never },
  ...infer ArgsRemaining
]
  ? ArgsRemaining extends []
    ? R
    : (...args: ArgsRemaining) => R
  : never = partial_;
