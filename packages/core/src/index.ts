import { QueryEngine } from "@comunica/query-sparql-rdfjs";

import { getCompleteResult } from "./common";
import { parseQuery } from "./parse";
import { defaultParser } from "./parse/parser";
import { readAll } from "./readAll";

import type * as IR from "./IntermediateResult";
import type { Parser, ParseWarning } from "./parse/common";
import type { Source } from "@rdfjs/types";
import type { JsonValue } from "type-fest";
import { toSparql } from "sparqlalgebrajs";

const engine = new QueryEngine();

export interface ReadQueryResult<Data> {
  data: Data | null;
  parseWarnings: ParseWarning[];
}

/**
 * Reads the query once and returns the result.
 *
 * @template Data The expected shape of the data returned by the query.
 *                Eventually, this will be derived from the query itself. For
 *                now, it must be given explicitly.
 * @param graph The RDF data to query.
 * @param query The Quild query to read.
 */
export const readQuery = async <Data extends JsonValue>(
  source: Source,
  query: JsonValue,
  { parser = defaultParser }: { parser?: Parser } = {}
): Promise<ReadQueryResult<Data>> => {
  const { intermediateResult, sparql, warnings } = await parseQuery(
    query,
    parser
  );

  // console.log(JSON.stringify(query, null, 2));
  // console.log(toSparql(sparql));

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
     The type of `readQuery` is not yet derived from the query. */
  const data = getCompleteResult(ir) as Data | null;

  return { data, parseWarnings: warnings };
};
