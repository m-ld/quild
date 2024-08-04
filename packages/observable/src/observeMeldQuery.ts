import { watchQuery } from "@m-ld/m-ld/ext/rx";
import {
  withPropertyTypes as withPropertyTypesCore,
  type JsonLDDocument,
  type QueryPropertyTypes,
  type EmptyContext,
  type ReadQueryResult,
  type QueryResult,
  type GlobalPropertyTypes,
} from "@quild/core";
import { parser } from "@quild/core/m-ld";

import type { MeldClone } from "@m-ld/m-ld";
import type { Observable } from "rxjs";

/**
 * Prefix for {@link observeMeldQuery} to use a different set of property types.
 */
export const withPropertyTypes = <PropertyTypes>() => ({
  /** @see {@link observeMeldQuery} */
  observeMeldQuery: <Query>(
    meld: MeldClone,
    query: JsonLDDocument<
      QueryPropertyTypes<PropertyTypes>,
      EmptyContext,
      Query
    >
  ): Observable<ReadQueryResult<QueryResult<Query, PropertyTypes>>> =>
    watchQuery(
      meld,
      (state) =>
        withPropertyTypesCore<PropertyTypes>().readQuery(state, query, {
          parser,
        }),
      (_update, state) =>
        withPropertyTypesCore<PropertyTypes>().readQuery(state, query, {
          parser,
        })
    ),
});

/**
 * Observe the results of a Quild query over a m-ld clone, emitting the latest
 * result whenever it changes--and potentially when it hasn't. An emission is
 * not (currently) a guarantee that the result has changed, but every change is
 * guaranteed to be emitted.
 *
 * @param meld The m-ld clone to query.
 * @param query The Quild query to run.
 * @returns An observable of the query results.
 */
export const observeMeldQuery = <Query>(
  meld: MeldClone,
  query: JsonLDDocument<
    QueryPropertyTypes<GlobalPropertyTypes>,
    EmptyContext,
    Query
  >
) => withPropertyTypes<GlobalPropertyTypes>().observeMeldQuery(meld, query);
