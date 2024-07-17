import { DataFactory } from "rdf-data-factory";
import { Factory as AlgebraFactory } from "sparqlalgebrajs";

import * as IR from "./IntermediateResult";

import type { JsonValue } from "type-fest";

export const PLACEHOLDER = "?";
export const isPlaceholder = (v: unknown): v is typeof PLACEHOLDER =>
  v === PLACEHOLDER;

export const df = new DataFactory();
export const af = new AlgebraFactory(df);

export const string = df.namedNode("http://www.w3.org/2001/XMLSchema#string");
export const integer = df.namedNode("http://www.w3.org/2001/XMLSchema#integer");
export const double = df.namedNode("http://www.w3.org/2001/XMLSchema#double");
export const boolean = df.namedNode("http://www.w3.org/2001/XMLSchema#boolean");

export const nil = df.namedNode(
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil"
);
export const first = df.namedNode(
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#first"
);
export const rest = df.namedNode(
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest"
);

export const type = df.namedNode(
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
);

/**
 * Returns the complete result of an intermediate result, or `null` if it is not
 * yet complete.
 * @param ir The intermediate result.
 * @returns The complete result, or `null` if it is not yet complete.
 */
export const getCompleteResult = (ir: IR.IntermediateResult) => {
  let data: JsonValue | null;
  try {
    data = ir.result();
  } catch (e) {
    if (e instanceof IR.IncompleteResultError) {
      data = null;
    } else {
      throw e;
    }
  }
  return data;
};
