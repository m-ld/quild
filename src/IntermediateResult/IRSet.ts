import { update } from "./common";

import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonArray } from "type-fest";

/**
 * Represents a JSON array in the query and result which corresponds to a set in
 * the data.
 *
 * @example
 * ### Query
 * ```json
 * [
 *   {
 *     "eye_color": "blue",
 *     "name": "?",
 *   }
 * ]
 * ```
 *
 * ### Result
 * ```json
 * [
 *   {
 *     "eye_color": "blue",
 *     "name": "Luke Skywalker",
 *   },
 *   {
 *     "eye_color": "blue",
 *     "name": "Owen Lars",
 *   }
 * ]
 */
// Named `IRSet` to avoid conflict with the global `Set` type. Used as
// `IR.Set` elsewhere.
export class IRSet implements IntermediateResult {
  /**
   * @param variable The variable that elements of this set are bound to.
   * @param template The template to apply to each element of this set.
   * @param results The results so far, indexed by node names.
   */
  constructor(
    private readonly variable: RDF.Variable,
    private readonly template: IntermediateResult,
    private readonly results: Record<string, IntermediateResult> = {}
  ) {}

  addSolution(solution: RDF.Bindings): IntermediateResult {
    const v = solution.get(this.variable);

    // If there's no binding for us in the solution, ignore it.
    // TODO: Is this the correct thing to do?
    if (!v) {
      return this;
    }

    return new IRSet(
      this.variable,
      this.template,
      update(this.results, JSON.stringify(v), (ir) =>
        (ir ?? this.template).addSolution(solution)
      )
    );
  }

  result(): JsonArray {
    return Object.values(this.results).map((r) => r.result());
  }
}
