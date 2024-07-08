import type { MeldClone } from "@m-ld/m-ld";
import type { JsonValue } from "type-fest";
import { observeMeld } from "./observeMeld";
import { queryMap } from "./queryMap";
import { map } from "rxjs";

/**
 * Observe the results of a Quild query over a m-ld clone, emitting the latest
 * result whenever it changes--and potentially when it hasn't. An emission is
 * not (currently) a guarantee that the result has changed, but every change is
 * guaranteed to be emitted.
 *
 * @template Data The expected shape of the data returned by the query.
 *                Eventually, this will be derived from the query itself. For
 *                now, it must be given explicitly.
 * @param meld The m-ld clone to query.
 * @param query The Quild query to run.
 * @returns An observable of the query results.
 */
export const observeMeldQuery = <Data extends JsonValue>(
  meld: MeldClone,
  query: JsonValue
) =>
  observeMeld(meld).pipe(
    map(([_update, state]) => state),
    queryMap<Data>(query)
  );
