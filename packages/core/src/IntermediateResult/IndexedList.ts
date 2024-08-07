import { getCompleteResult, integer } from "../common";

import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonArray } from "type-fest";

/**
 * Represents a JSON-LD list in the query and result, in which the indexes of
 * the elements are bound to a variable in the solutions. In each solution
 * `indexVariable` should be bound to the index of the item which the solution
 * applies to.
 *
 * @example
 * ### Query
 * ```json
 * {
 *   "@list": [{ "name": "?" }]
 * }
 * ```
 *
 * ### Result
 * ```json
 * {
 *   "@list": [
 *     { "name": "Luke Skywalker" },
 *     { "name": "Wedge Antilles" }
 *   ]
 * }
 * ```
 */
export class IndexedList implements IntermediateResult {
  /**
   * @param indexVariable The variable bound to the index of each item.
   * @param template The template for each item.
   * @param results The results so far.
   */
  constructor(
    private readonly indexVariable: RDF.Variable,
    private readonly template: IntermediateResult,
    private readonly results: IntermediateResult[] = []
  ) {}

  addSolution(solution: RDF.Bindings): IntermediateResult {
    const v = solution.get(this.indexVariable);

    // If there's no binding for us in the solution, ignore it.
    // TODO: Is this the correct thing to do?
    if (!v) {
      return this;
    }

    if (v.termType !== "Literal" || !v.datatype.equals(integer)) {
      throw new Error(`Expected integer, got ${JSON.stringify(v)}`);
    }

    const index = parseInt(v.value);
    const newResults = this.results.slice();
    newResults.length = Math.max(newResults.length, index + 1);
    newResults[index] = (newResults[index] ?? this.template).addSolution(
      solution
    );

    return new IndexedList(this.indexVariable, this.template, newResults);
  }

  result(): JsonArray {
    return this.results.map((ir) => getCompleteResult(ir) ?? {});
  }
}
