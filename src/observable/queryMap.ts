import { OperatorFunction, concatMap } from "rxjs";
import { type ReadQueryResult, readQuery } from "..";
import type { JsonValue } from "type-fest";
import * as RDF from "@rdfjs/types";

/**
 * Maps an Observable of RDF sources (taken as sequential states of a mutable
 * store) to the result of a Quild query over each.
 *
 * @template Data The expected shape of the data returned by the query.
 *                Eventually, this will be derived from the query itself. For
 *                now, it must be given explicitly.
 * @param query The Quild query to run.
 * @returns An operator that maps RDF sources to query results.
 */
export const queryMap = <Data extends JsonValue>(
  query: JsonValue
): OperatorFunction<RDF.Source<RDF.Quad>, ReadQueryResult<Data>> =>
  concatMap(
    (state) =>
      // TODO: Replace this type assertion with actually derived types.
      readQuery(state, query) as Promise<ReadQueryResult<Data>>
  );
