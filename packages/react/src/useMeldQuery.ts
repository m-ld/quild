import { withPropertyTypes as withPropertyTypesObservable } from "@quild/observable";
import { useEffect, useState } from "react";

import type { MeldClone } from "@m-ld/m-ld";
import type {
  EmptyContext,
  GlobalPropertyTypes,
  JsonLDDocument,
  QueryPropertyTypes,
  QueryResult,
  ReadQueryResult,
} from "@quild/core";

/**
 * Prefix for {@link useMeldQuery} to use a different set of property types.
 */
export const withPropertyTypes = <PropertyTypes>() => ({
  /** @see {@link useMeldQuery} */
  useMeldQuery: <Query>(
    meld: MeldClone | null,
    query: JsonLDDocument<
      QueryPropertyTypes<PropertyTypes>,
      EmptyContext,
      Query
    >
  ) => {
    const [result, setResult] =
      useState<ReadQueryResult<QueryResult<Query, PropertyTypes>>>();

    useEffect(() => {
      if (meld) {
        const o =
          withPropertyTypesObservable<PropertyTypes>().observeMeldQuery<Query>(
            meld,
            query
          );
        const subscription = o.subscribe(setResult);

        return () => {
          subscription.unsubscribe();
        };
      }
    }, [meld]);

    return result ?? { data: undefined, parseWarnings: undefined };
  },
});

/**
 * A hook that subscribes to a Quild query over a m-ld clone and returns the
 * latest result.
 *
 * @param meld The m-ld clone to query, or `null` to skip the hook (as when the
 *             clone is not yet available).
 * @param query The Quild query to run.
 * @returns The latest result of the query.
 */
export const useMeldQuery = <Query>(
  meld: MeldClone,
  query: JsonLDDocument<
    QueryPropertyTypes<GlobalPropertyTypes>,
    EmptyContext,
    Query
  >
) => withPropertyTypes<GlobalPropertyTypes>().useMeldQuery(meld, query);
