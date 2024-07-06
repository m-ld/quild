import { QueryEngine } from "@comunica/query-sparql-rdfjs";

import * as IR from "./IntermediateResult";
import { parseQuery } from "./parse";
import { readAll } from "./readAll";

import type { Source } from "@rdfjs/types";
import type { JsonValue } from "type-fest";
import type { ParseWarning } from "./parse/common";

const engine = new QueryEngine();

export type ReadQueryResult<Data> = {
  data: Data;
  parseWarnings: ParseWarning[];
};

/**
 * Reads the query once and returns the result.
 * @param graph The RDF data to query.
 * @param query The Quild query to read.
 */
export const readQuery = async (
  source: Source,
  query: JsonValue
): Promise<ReadQueryResult<JsonValue>> => {
  const { intermediateResult, sparql, warnings } = await parseQuery(query);

  const bindingsStream = await engine.queryBindings(sparql, {
    sources: [source],
  });

  const solutions = await readAll(bindingsStream);

  const ir = solutions.reduce<IR.IntermediateResult>(
    (partialIr, solution) => partialIr.addSolution(solution),
    intermediateResult
  );

  let data;
  try {
    data = ir.result();
  } catch (e) {
    if (e instanceof IR.IncompleteResultError) {
      data = null;
    } else {
      throw e;
    }
  }
  return { data, parseWarnings: warnings };
};
