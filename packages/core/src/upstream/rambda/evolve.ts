// TODO: PR to rambda

import { evolve as evolve_ } from "rambdax";

export type Evolver<From> = {
  [K in keyof From]?: (v: From[K]) => unknown;
};

export function evolve<From, TEvolver extends Evolver<From>>(
  evolver: TEvolver,
  obj: From
): {
  [K in keyof From]: TEvolver[K] extends (...args: never[]) => infer R
    ? R
    : From[K];
};

export function evolve<TEvolver extends Evolver<unknown>>(
  evolver: TEvolver
): TEvolver extends Evolver<infer EvolvingPartOfFrom>
  ? <From extends EvolvingPartOfFrom>(
      obj: From
    ) => {
      [K in keyof From]: K extends keyof TEvolver
        ? TEvolver[K] extends (...args: never[]) => infer R
          ? R
          : never
        : From[K];
    }
  : never;

/* eslint-disable-next-line @typescript-eslint/no-explicit-any
   ---
   Doesn't matter for implementation */
export function evolve(evolver: any, obj?: any): any {
  return obj ? evolve_(evolver, obj) : evolve_(evolver);
}
