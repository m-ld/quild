import { QueryEngine } from "@comunica/query-sparql-rdfjs";

import { getCompleteResult } from "./common";
import { parseQuery } from "./parse";
import { defaultParser } from "./parse/parser";
import { readAll } from "./readAll";

import type { EmptyContext } from "./Context";
import type * as IR from "./IntermediateResult";
import type { JsonLDDocument } from "./JsonLDDocument";
import type { QueryResult } from "./QueryResult";
import type { Parser, ParseWarning } from "./parse/common";
import type * as RDF from "@rdfjs/types";
import type { JsonValue, LiteralUnion } from "type-fest";

const engine = new QueryEngine();

export interface ReadQueryResult<Data> {
  data: Data | null;
  parseWarnings: ParseWarning[];
}

export type QueryPropertyTypes<PropertyTypes> = {
  [K in keyof PropertyTypes]: LiteralUnion<PropertyTypes[K], "?">;
};

export type { JsonLDDocument } from "./JsonLDDocument";
export type { EmptyContext } from "./Context";
export type { QueryResult } from "./QueryResult";

/**
 * Prefix for {@link readQuery} to use a different set of property types.
 */
export const withPropertyTypes = <PropertyTypes>() => ({
  /** @see {@link readQuery} */
  readQuery: async <Query>(
    source: RDF.Source,
    query: JsonLDDocument<
      QueryPropertyTypes<PropertyTypes>,
      EmptyContext,
      Query
    >,
    { parser = defaultParser }: { parser?: Parser } = {}
  ): Promise<ReadQueryResult<QueryResult<Query, PropertyTypes>>> => {
    const { intermediateResult, sparql, warnings } = await parseQuery(
      /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
       ---
       We calculate the type and assert it's returned, but we don't flow the
       detailed query types through the parser. */
      query as JsonValue,
      parser
    );

    const bindingsStream = await engine.queryBindings(sparql, {
      sources: [source],
    });

    const solutions = await readAll(bindingsStream);

    const ir = solutions.reduce<IR.IntermediateResult>(
      (partialIr, solution) => partialIr.addSolution(solution),
      intermediateResult
    );

    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
       ---
       We calculate the type and assert it's returned, but we don't flow the
       detailed query types through the parser. */
    const data = getCompleteResult(ir) as QueryResult<
      Query,
      PropertyTypes
    > | null;

    return { data, parseWarnings: warnings };
  },
});

/**
 * The property types used by the default {@link readQuery} function. You can
 * add to these types with declaration merging. Or, use
 * {@link withPropertyTypes} to use a different set of property types.
 */
/* eslint-disable-next-line @typescript-eslint/no-empty-object-type
   --
   This is a placeholder for declaration merging. */
export interface GlobalPropertyTypes {}

/**
 * Read a query once from the given source. Uses the global property types. To
 * supply your own property types, use {@link withPropertyTypes}.
 *
 * @param meld The m-ld clone to query.
 * @param query The Quild query to run.
 * @param options.parser The parser to use for the query.
 * @returns A {@link ReadQueryResult} with the data matching the query.
 */
export const readQuery = <Query>(
  source: RDF.Source,
  query: JsonLDDocument<
    QueryPropertyTypes<GlobalPropertyTypes>,
    EmptyContext,
    Query
  >,
  { parser = defaultParser }: { parser?: Parser } = {}
) =>
  withPropertyTypes<GlobalPropertyTypes>().readQuery(source, query, { parser });
