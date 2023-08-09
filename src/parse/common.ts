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
  /** The IR which will accept bindings and produce a result. */
  intermediateResult: IRType;
  /** Patterns to include in the SPARQL query. */
  patterns: Algebra.Pattern[];
  /**
   * Variables to project in the SPARQL query. A subset of the variables used
   * in the {@link patterns}; specifically, those the {@link intermediateResult}
   * is interested in.
   */
  projections: RDF.Variable[];
  /** Warnings generated during parsing. */
  warnings: ParseWarning[];
  /** A term representing the root of the parsed query. */
  term: RDF.Term;
}

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
