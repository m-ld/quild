import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

export interface IntermediateResult {
  addSolution(solution: RDF.Bindings): IntermediateResult;
  result(): JsonValue;
}
