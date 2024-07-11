import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

export class NativeValue implements IntermediateResult {
  constructor(private readonly value: JsonValue) {}

  addSolution(_solution: RDF.Bindings): IntermediateResult {
    return this;
  }

  result(): JsonValue {
    return this.value;
  }
}
