import { QueryEngine } from "@comunica/query-sparql-rdfjs";

import { parseQuery } from "./parse";
import { readAll } from "./readAll";

import type * as IR from "./IntermediateResult";
import type { Source } from "@rdfjs/types";
import type { JsonValue } from "type-fest";

const engine = new QueryEngine();

/**
 * Reads the query once and returns the result.
 * @param graph The RDF data to query.
 * @param query The Quild query to read.
 */
export const query = async (
  source: Source,
  query: JsonValue
): Promise<JsonValue> => {
  const { intermediateResult, sparql } = await parseQuery(query);

  const bindingsStream = await engine.queryBindings(sparql, {
    sources: [source],
  });

  const solutions = await readAll(bindingsStream);

  const ir = solutions.reduce<IR.IntermediateResult>(
    (partialIr, solution) => partialIr.addSolution(solution),
    intermediateResult
  );

  return ir.result();
};
