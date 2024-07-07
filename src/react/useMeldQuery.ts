import { useEffect, useState } from "react";

import { type ReadQueryResult, readQuery } from "..";

import type { MeldClone, MeldReadState } from "@m-ld/m-ld";
import type { JsonValue } from "type-fest";

// Use `Data` to explicitly assert the shape of the returned data.
export const useMeldQuery = <Data>(
  meld: MeldClone | undefined,
  query: JsonValue
) => {
  const [result, setResult] = useState<ReadQueryResult<Data>>();

  useEffect(() => {
    if (meld) {
      const doRead = async (state: MeldReadState) => {
        return readQuery(state, query).then((results) => {
          // TODO: Replace this type assertion with actually derived
          // types.
          setResult(results as ReadQueryResult<Data>);
        });
      };

      const subscription = meld.read(doRead, (_update, state) => doRead(state));

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [meld]);

  return result || { data: undefined, parseWarnings: undefined };
};
