import { isPlainObject as isPlainObject_ } from "lodash-es";
import { map } from "rambdax";

import { evolve, prepend } from "../upstream/rambda";

import type * as IR from "../IntermediateResult";
import type * as RDF from "@rdfjs/types";
import type jsonld from "jsonld";
import type { Algebra } from "sparqlalgebrajs";

export interface ParseWarning {
  message: string;
  path: Array<string | number>;
}

export interface Parsed<
  IRType extends IR.IntermediateResult = IR.IntermediateResult
> {
  intermediateResult: IRType;
  patterns: Algebra.Pattern[];
  projections: RDF.Variable[];
  warnings: ParseWarning[];
}

// TK: Delete?
// /**
//  * Array.isArray, but typed to properly narrow types which may be readonly
//  * arrays.
//  *
//  * @see https://github.com/microsoft/TypeScript/issues/17002
//  */
// export const isArray = Array.isArray as (
//   arg: unknown
// ) => arg is readonly unknown[];

/**
 * isPlainObject, but typed to narrow the object to a string record.
 *
 * @see https://github.com/microsoft/TypeScript/issues/17002
 */
/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
   ---
   Allow type correction */
export const isPlainObject = isPlainObject_ as (
  value: unknown
) => value is Record<string, unknown>;

export const nestWarningsUnderKey = (
  key: ParseWarning["path"][number]
): ((
  iterable: ParseWarning[]
) => Array<{ message: string; path: Array<typeof key> }>) =>
  map(
    evolve({
      path: prepend(key)<typeof key>,
    })
  );

/**
 * An object passed to a parsing function with all the contextual information
 * required to provide a result.
 */
export interface QueryInfo<Query> {
  /** The query to parse. */
  query: Query;
  /** The variable representing the node which this query applies to. */
  variable: RDF.Variable;
  /** The context in which to interpret the query. */
  ctx: jsonld.ActiveContext;
}

export const queryMatches = <T>(
  predicate: (x: unknown) => x is T,
  queryInfo: QueryInfo<unknown>
): queryInfo is QueryInfo<T> => predicate(queryInfo.query);
