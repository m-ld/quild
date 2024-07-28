import { type Observable, share, firstValueFrom, skip } from "rxjs";

/**
 * Generates an infinite sequence of promises of each emission from an
 * observable.
 * @template V The type of the observable's emissions.
 * @param observable The observable to observe.
 * @returns An iterator of promises of emissions.
 *
 * @example
 * ```typescript
 * import { of } from "rxjs";
 *
 * const observable = of(1, 2, 3);
 * const [first, second, third] = emissions(observable);
 *
 * await first; // 1
 * await second; // 2
 * await third; // 3
 * ```
 */
export function* emissions<V>(observable: Observable<V>) {
  const shared = observable.pipe(share());
  let n = 0;
  while (true) {
    yield firstValueFrom(shared.pipe(skip(n)));
    n += 1;
  }
}
