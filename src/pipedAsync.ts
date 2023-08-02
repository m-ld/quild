// PRed in: https://github.com/selfrefactor/rambda/pull/698

import { reduce } from "rambdax";

export function pipeAsync<TArg, R1, R2, R3, R4, R5, R6, R7, TResult>(
  ...funcs: [
    f1: (a: Awaited<TArg>) => R1,
    f2: (a: Awaited<R1>) => R2,
    f3: (a: Awaited<R2>) => R3,
    f4: (a: Awaited<R3>) => R4,
    f5: (a: Awaited<R4>) => R5,
    f6: (a: Awaited<R5>) => R6,
    f7: (a: Awaited<R6>) => R7,
    ...func: Array<(a: unknown) => unknown>,
    fnLast: (a: unknown) => TResult
  ]
): (a: TArg) => TResult; // fallback overload if number of piped functions greater than 7
export function pipeAsync<TArg, R1, R2, R3, R4, R5, R6, R7>(
  f1: (a: Awaited<TArg>) => R1,
  f2: (a: Awaited<R1>) => R2,
  f3: (a: Awaited<R2>) => R3,
  f4: (a: Awaited<R3>) => R4,
  f5: (a: Awaited<R4>) => R5,
  f6: (a: Awaited<R5>) => R6,
  f7: (a: Awaited<R6>) => R7
): (a: TArg) => R7;
export function pipeAsync<TArg, R1, R2, R3, R4, R5, R6>(
  f1: (a: Awaited<TArg>) => R1,
  f2: (a: Awaited<R1>) => R2,
  f3: (a: Awaited<R2>) => R3,
  f4: (a: Awaited<R3>) => R4,
  f5: (a: Awaited<R4>) => R5,
  f6: (a: Awaited<R5>) => R6
): (a: TArg) => R6;
export function pipeAsync<TArg, R1, R2, R3, R4, R5>(
  f1: (a: Awaited<TArg>) => R1,
  f2: (a: Awaited<R1>) => R2,
  f3: (a: Awaited<R2>) => R3,
  f4: (a: Awaited<R3>) => R4,
  f5: (a: Awaited<R4>) => R5
): (a: TArg) => R5;
export function pipeAsync<TArg, R1, R2, R3, R4>(
  f1: (a: Awaited<TArg>) => R1,
  f2: (a: Awaited<R1>) => R2,
  f3: (a: Awaited<R2>) => R3,
  f4: (a: Awaited<R3>) => R4
): (a: TArg) => R4;
export function pipeAsync<TArg, R1, R2, R3>(
  f1: (a: Awaited<TArg>) => R1,
  f2: (a: Awaited<R1>) => R2,
  f3: (a: Awaited<R2>) => R3
): (a: TArg) => R3;
export function pipeAsync<TArg, R1, R2>(
  f1: (a: Awaited<TArg>) => R1,
  f2: (a: Awaited<R1>) => R2
): (a: TArg) => R2;
export function pipeAsync<TArg, R1>(
  f1: (a: Awaited<TArg>) => R1
): (a: Awaited<TArg>) => R1;

export function pipeAsync(...fnList: Array<(x: unknown) => unknown>) {
  return function (startArgument: unknown) {
    return reduce(async (value, fn) => fn(await value), startArgument, fnList);
  };
}

export function pipedAsync<A, B>(input: A, fn0: (x: Awaited<A>) => B): B;
export function pipedAsync<A, B, C>(
  input: A,
  fn0: (x: Awaited<A>) => B,
  fn1: (x: Awaited<B>) => C
): C;
export function pipedAsync<A, B, C, D>(
  input: A,
  fn0: (x: Awaited<A>) => B,
  fn1: (x: Awaited<B>) => C,
  fn2: (x: Awaited<C>) => D
): D;
export function pipedAsync<A, B, C, D, E>(
  input: A,
  fn0: (x: Awaited<A>) => B,
  fn1: (x: Awaited<B>) => C,
  fn2: (x: Awaited<C>) => D,
  fn3: (x: Awaited<D>) => E
): E;
export function pipedAsync<A, B, C, D, E, F>(
  input: A,
  fn0: (x: Awaited<A>) => B,
  fn1: (x: Awaited<B>) => C,
  fn2: (x: Awaited<C>) => D,
  fn3: (x: Awaited<D>) => E,
  fn4: (x: Awaited<E>) => F
): F;
export function pipedAsync<A, B, C, D, E, F, G>(
  input: A,
  fn0: (x: Awaited<A>) => B,
  fn1: (x: Awaited<B>) => C,
  fn2: (x: Awaited<C>) => D,
  fn3: (x: Awaited<D>) => E,
  fn4: (x: Awaited<E>) => F,
  fn5: (x: Awaited<F>) => G
): G;
export function pipedAsync<A, B, C, D, E, F, G, H>(
  input: A,
  fn0: (x: Awaited<A>) => B,
  fn1: (x: Awaited<B>) => C,
  fn2: (x: Awaited<C>) => D,
  fn3: (x: Awaited<D>) => E,
  fn4: (x: Awaited<E>) => F,
  fn5: (x: Awaited<F>) => G,
  fn6: (x: Awaited<G>) => H
): H;
// TODO: This should break
export function pipedAsync<A, B, C, D, E, F, G, H, I>(
  input: A,
  fn0: (x: Awaited<A>) => B,
  fn1: (x: Awaited<B>) => C,
  fn2: (x: Awaited<C>) => D,
  fn3: (x: Awaited<D>) => E,
  fn4: (x: Awaited<E>) => F,
  fn5: (x: Awaited<F>) => G,
  fn6: (x: Awaited<G>) => H,
  fn7: (x: Awaited<H>) => I
): I;

/* eslint-disable
   @typescript-eslint/no-unsafe-argument,
   @typescript-eslint/ban-ts-comment
  ---
  We don't need type checking here; this is just copying code from a PR headed
  upstream.
*/
// @ts-expect-error
export function pipedAsync(input, ...funcs) {
  // @ts-expect-error
  return pipeAsync(...funcs)(input);
}
/* eslint-enable
   @typescript-eslint/no-unsafe-argument,
   @typescript-eslint/ban-ts-comment
   --- ^^^
*/
