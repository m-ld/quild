import { useEffect, useState } from "react";
import { Observable } from "rxjs";

import { type ReadQueryResult, readQuery } from "..";

import type { MeldClone, MeldReadState } from "@m-ld/m-ld";
import type { JsonValue } from "type-fest";

const observeMeldQuery = <Data>(meld: MeldClone, query: JsonValue) => {
  return new Observable<ReadQueryResult<Data>>((subscriber) => {
    const doRead = async (state: MeldReadState) => {
      return readQuery(state, query).then((results) => {
        // TODO: Replace this type assertion with actually derived
        // types.
        subscriber.next(results as ReadQueryResult<Data>);
      });
    };
    const subscription = meld.read(doRead, (_update, state) => doRead(state));
    return () => {
      subscription.unsubscribe();
    };
  });
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
