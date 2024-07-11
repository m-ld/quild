import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonArray } from "type-fest";

// In the style of Clojure's `update`
// https://clojuredocs.org/clojure.core/update
const update = <K extends keyof O, O extends object>(
  obj: O,
  key: K,
  replaceFn: (previousValue: O[K] | undefined) => O[K]
): O => ({ ...obj, [key]: replaceFn(obj[key]) });

/**
 * Represents a JSON array in the query and result---specifically where the
 * query has a single element which applies to each element in the result.
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
 *   }
 * ]
 */
// Named `IRArray` to avoid conflict with the global `Array` type. Used as
// `IR.Array` elsewhere.
export class IRArray implements IntermediateResult {
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

    return new IRArray(
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
