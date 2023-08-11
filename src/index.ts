import { QueryEngine } from "@comunica/query-sparql-rdfjs";

import { parse } from "./parse";
import { readAll } from "./readAll";

import type * as IR from "./IntermediateResult";
import type { Source } from "@rdfjs/types";
import type * as JsonLD from "jsonld";
import type { JsonValue } from "type-fest";

const engine = new QueryEngine();

/**
 * Reads the query once and returns the result.
 * @param graph The RDF data to query.
 * @param query The xQL query to read.
 */
export const query = async (
  source: Source,
  query: JsonLD.NodeObject | JsonLD.NodeObject[]
): Promise<JsonValue> => {
  const { intermediateResult, sparql } = await parse(query);

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
