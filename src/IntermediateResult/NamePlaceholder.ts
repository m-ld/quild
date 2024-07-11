import { NativeValue } from "./NativeValue";
import { IncompleteResultError, NotANamedNodeError } from "./errors";

import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

export class NamePlaceholder implements IntermediateResult {
  constructor(private readonly variable: RDF.Variable) {}

  addSolution(solution: RDF.Bindings): IntermediateResult {
    const value = solution.get(this.variable);

    // If there's no binding for us in the solution, ignore it.
    // TODO: Is this the correct thing to do?
    if (!value) {
      return this;
    }

    if (value.termType !== "NamedNode") {
      throw new NotANamedNodeError(value);
    } else {
      return new NativeValue(value.value);
    }
  }

  result(): JsonValue {
    throw new IncompleteResultError(this.variable);
  }
}
