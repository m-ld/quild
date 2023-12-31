import { QueryEngine } from "@comunica/query-sparql-rdfjs";

import * as IR from "./IntermediateResult";
import { parseQuery } from "./parse";
import { readAll } from "./readAll";

import type { Source } from "@rdfjs/types";
import type { JsonValue } from "type-fest";

const engine = new QueryEngine();

/**
 * Reads the query once and returns the result.
 * @param graph The RDF data to query.
 * @param query The xQL query to read.
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

  let result;
  try {
    result = ir.result();
  } catch (e) {
    if (e instanceof IR.IncompleteResultError) {
      return null;
    } else {
      throw e;
    }
  }
  return result;
};
