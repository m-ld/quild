import { useEffect, useState } from "react";

import { type ReadQueryResult } from "..";
import { observeMeldQuery } from "../observable/observeMeldQuery";

import type { MeldClone } from "@m-ld/m-ld";
import type { JsonValue } from "type-fest";

/**
 * A hook that subscribes to a Quild query over a m-ld clone and returns the
 * latest result.
 *
 * @template Data The expected shape of the data returned by the query.
 *                Eventually, this will be derived from the query itself. For
 *                now, it must be given explicitly.
 * @param meld The m-ld clone to query.
 * @param query The Quild query to run.
 * @returns The latest result of the query.
 */
export const useMeldQuery = <Data extends JsonValue>(
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
