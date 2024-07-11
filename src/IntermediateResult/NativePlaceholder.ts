import { isUndefined } from "lodash-es";

import { LiteralValue } from "./LiteralValue";
import { BadNativeValueError, IncompleteResultError } from "./errors";
import { toJSONNative } from "../representation";

import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

export class NativePlaceholder implements IntermediateResult {
  constructor(private readonly variable: RDF.Variable) {}

  addSolution(solution: RDF.Bindings): IntermediateResult {
    const value = solution.get(this.variable);

    // If there's no binding for us in the solution, ignore it.
    // TODO: Is this the correct thing to do?
    if (!value) {
      return this;
    }

    const rep = toJSONNative(value);
    if (isUndefined(rep)) {
      throw new BadNativeValueError(value);
    } else {
      return new LiteralValue(rep);
    }
  }

  result(): JsonValue {
    throw new IncompleteResultError(this.variable);
  }
}
