import { map } from "rambdax";

import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

export class NodeObject implements IntermediateResult {
  constructor(private readonly results: Record<string, IntermediateResult>) {}

  // TODO: Test
  addMapping(k: string, v: IntermediateResult) {
    return new NodeObject({ ...this.results, [k]: v });
  }

  addSolution(solution: RDF.Bindings): IntermediateResult {
    return new NodeObject(map((ir) => ir.addSolution(solution), this.results));
  }

  result(): JsonValue {
    return map((r) => r.result(), this.results);
  }
}
