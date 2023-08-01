// To PR upstream to Rambda

/* eslint-disable no-await-in-loop -- This one's intentional. */

// prettier-ignore
export function pipedAsync<A, B>(input: A, fn0: (x: Awaited<A>) => B) : B;
// prettier-ignore
export function pipedAsync<A, B, C>(input: A, fn0: (x: Awaited<A>) => B, fn1: (x: Awaited<B>) => C) : C;
// prettier-ignore
export function pipedAsync<A, B, C, D>(input: A, fn0: (x: Awaited<A>) => B, fn1: (x: Awaited<B>) => C, fn2: (x: Awaited<C>) => D) : D;
// prettier-ignore
export function pipedAsync<A, B, C, D, E>(input: A, fn0: (x: Awaited<A>) => B, fn1: (x: Awaited<B>) => C, fn2: (x: Awaited<C>) => D, fn3: (x: Awaited<D>) => E) : E;
// prettier-ignore
export function pipedAsync<A, B, C, D, E, F>(input: A, fn0: (x: Awaited<A>) => B, fn1: (x: Awaited<B>) => C, fn2: (x: Awaited<C>) => D, fn3: (x: Awaited<D>) => E, fn4: (x: Awaited<E>) => F) : F;
// prettier-ignore
export function pipedAsync<A, B, C, D, E, F, G>(input: A, fn0: (x: Awaited<A>) => B, fn1: (x: Awaited<B>) => C, fn2: (x: Awaited<C>) => D, fn3: (x: Awaited<D>) => E, fn4: (x: Awaited<E>) => F, fn5: (x: Awaited<F>) => G) : G;
// prettier-ignore
export function pipedAsync<A, B, C, D, E, F, G, H>(input: A, fn0: (x: Awaited<A>) => B, fn1: (x: Awaited<B>) => C, fn2: (x: Awaited<C>) => D, fn3: (x: Awaited<D>) => E, fn4: (x: Awaited<E>) => F, fn5: (x: Awaited<F>) => G, fn6: (x: Awaited<G>) => H) : H;
// prettier-ignore
export function pipedAsync<A, B, C, D, E, F, G, H, I>(input: A, fn0: (x: Awaited<A>) => B, fn1: (x: Awaited<B>) => C, fn2: (x: Awaited<C>) => D, fn3: (x: Awaited<D>) => E, fn4: (x: Awaited<E>) => F, fn5: (x: Awaited<F>) => G, fn6: (x: Awaited<G>) => H, fn7: (x: Awaited<H>) => I) : I;

export async function pipedAsync<A>(
  ...[input, ...fnList]: [input: A, ...fnList: Array<(x: unknown) => unknown>]
) {
  let argumentsToPass: unknown = input;

  for (const fn of fnList) {
    argumentsToPass = await fn(argumentsToPass);
  }

  return argumentsToPass;
}
