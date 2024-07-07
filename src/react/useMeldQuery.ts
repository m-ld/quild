import { useEffect, useState } from "react";
import { Observable, from, map, mergeMap } from "rxjs";

import { type ReadQueryResult, readQuery } from "..";

import type { MeldClone, MeldReadState, MeldUpdate } from "@m-ld/m-ld";
import type { JsonValue } from "type-fest";

const observeMeld = (meld: MeldClone) => {
  return new Observable<[MeldUpdate | null, MeldReadState]>((subscriber) => {
    const subscription = meld.read(
      async (state: MeldReadState) => {
        subscriber.next([null, state]);
      },
      (update, state) =>
        (async (state: MeldReadState) => {
          subscriber.next([update, state]);
        })(state)
    );
    return () => {
      subscription.unsubscribe();
    };
  });
};

const observeMeldQuery = <Data>(meld: MeldClone, query: JsonValue) => {
  return observeMeld(meld).pipe(
    map(([_update, state]) => {
      // TODO: Replace this type assertion with actually derived types.
      return readQuery(state, query) as Promise<ReadQueryResult<Data>>;
    }),
    // Await promises.
    mergeMap((resultPromise) => from(resultPromise))
  );
};

// Use `Data` to explicitly assert the shape of the returned data.
export const useMeldQuery = <Data>(
  meld: MeldClone | undefined,
  query: JsonValue
) => {
  const [result, setResult] = useState<ReadQueryResult<Data>>();

  useEffect(() => {
    if (meld) {
      const o = observeMeldQuery<Data>(meld, query);
      const subscription = o.subscribe(setResult);

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [meld]);

  return result || { data: undefined, parseWarnings: undefined };
};
