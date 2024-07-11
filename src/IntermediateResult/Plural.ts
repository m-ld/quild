import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

// In the style of Clojure's `update`
// https://clojuredocs.org/clojure.core/update
const update = <K extends keyof O, O extends object>(
  obj: O,
  key: K,
  replaceFn: (previousValue: O[K] | undefined) => O[K]
): O => ({ ...obj, [key]: replaceFn(obj[key]) });

export class Plural implements IntermediateResult {
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

    return new Plural(
      this.variable,
      this.template,
      update(this.results, JSON.stringify(v), (ir) =>
        (ir ?? this.template).addSolution(solution)
      )
    );
  }

  result(): JsonValue {
    return Object.values(this.results).map((r) => r.result());
  }
}
