import { BadUnwrapError } from "./errors";

import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

// Workaround:
// https://github.com/microsoft/TypeScript/issues/17002#issuecomment-494937708
declare global {
  interface ArrayConstructor {
    isArray(arg: unknown): arg is readonly unknown[];
  }
}

export class Unwrapped implements IntermediateResult {
  constructor(
    private readonly container: string,
    private readonly child: IntermediateResult
  ) {}

  addSolution(solution: RDF.Bindings): IntermediateResult {
    return new Unwrapped(this.container, this.child.addSolution(solution));
  }

  result(): JsonValue {
    const newLocal = this.child.result();
    const inner =
      newLocal &&
      typeof newLocal === "object" &&
      !Array.isArray(newLocal) &&
      newLocal[this.container];
    if (!inner) {
      throw new BadUnwrapError(this.container, this.child.result());
    }
    return inner;
  }
}
