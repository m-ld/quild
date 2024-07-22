import { type ReadQueryResult, readQuery } from "@quild/core";
import { type OperatorFunction, concatMap } from "rxjs";

import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

/**
 * An operator which maps an Observable of RDF sources (taken as sequential
 * states of a mutable store) to an Observable of the result of a Quild query
 * over each.
 *
 * @template Data The expected shape of the data returned by the query.
 *                Eventually, this will be derived from the query itself. For
 *                now, it must be given explicitly.
 * @param query The Quild query to run.
 * @returns An operator function that maps RDF sources to query results.
 */
export const queryMap = <Data extends JsonValue>(
  query: JsonValue
): OperatorFunction<RDF.Source, ReadQueryResult<Data>> =>
  concatMap((state) => readQuery<Data>(state, query));
