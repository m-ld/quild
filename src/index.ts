import { QueryEngine } from "@comunica/query-sparql-rdfjs";

import * as IR from "./IntermediateResult";
import { parseQuery } from "./parse";
import { readAll } from "./readAll";

import type { ParseWarning } from "./parse/common";
import type { Source } from "@rdfjs/types";
import type { JsonValue } from "type-fest";

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
  query: JsonValue
): Promise<ReadQueryResult<Data>> => {
  const { intermediateResult, sparql, warnings } = await parseQuery(query);

  const bindingsStream = await engine.queryBindings(sparql, {
    sources: [source],
  });

  const solutions = await readAll(bindingsStream);

  const ir = solutions.reduce<IR.IntermediateResult>(
    (partialIr, solution) => partialIr.addSolution(solution),
    intermediateResult
  );

  let data: Data | null;
  try {
    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
       ---
       The type of `readQuery` is not yet derived from the query. */
    data = ir.result() as Data;
  } catch (e) {
    if (e instanceof IR.IncompleteResultError) {
      data = null;
    } else {
      throw e;
    }
  }
  return { data, parseWarnings: warnings };
};
