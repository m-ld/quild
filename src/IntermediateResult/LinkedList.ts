import { termToString } from "rdf-string";

import { update } from "./common";
import { type LinkedListObject, linearizeList } from "./linearizeList";
import { getCompleteResult, nil } from "../common";

import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonArray } from "type-fest";

/**
 * Represents a JSON-LD list in the query and result, in which the slots form a
 * linked list in the RDF data (as in an `rdf:List`).
 *
 * @see https://www.w3.org/TR/rdf11-schema/#ch_list
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
export class LinkedList implements IntermediateResult {
  /**
   * @param listVariable The variable bound to the head of the list.
   * @param slotVariable The variable bound to the slot of the current item in
   *                     question. (This is the same as {@link listVariable} for
   *                     the first item.)
   * @param restVariable The variable bound to the next slot in the list.
   * @param template The template for each item.
   * @param results The results so far.
   */
  constructor(
    private readonly listVariable: RDF.Variable,
    private readonly slotVariable: RDF.Variable,
    private readonly restVariable: RDF.Variable,
    private readonly template: IntermediateResult,
    private readonly head: RDF.Term | null = null,
    private readonly results: LinkedListObject<IntermediateResult> = {}
  ) {}

  addSolution(solution: RDF.Bindings): IntermediateResult {
    const list = solution.get(this.listVariable);
    const slot = solution.get(this.slotVariable);
    const rest = solution.get(this.restVariable);

    // If there's no binding for us in the solution, ignore it.
    // TODO: Is this the correct thing to do?
    if (!list || !slot || !rest) {
      return this;
    }

    if (this.head === null) {
      return new LinkedList(
        this.listVariable,
        this.slotVariable,
        this.restVariable,
        this.template,
        list,
        this.results
      ).addSolution(solution);
    } else {
      return new LinkedList(
        this.listVariable,
        this.slotVariable,
        this.restVariable,
        this.template,
        this.head,
        update(this.results, termToString(slot), (entry) =>
          entry
            ? { ...entry, value: entry.value.addSolution(solution) }
            : {
                next: rest.equals(nil) ? null : termToString(rest),
                value: this.template.addSolution(solution),
              }
        )
      );
    }
  }

  result(): JsonArray {
    if (this.head === null) {
      /* eslint-disable-next-line @typescript-eslint/no-throw-literal
       ---
       TODO: https://github.com/m-ld/quild/issues/15 */
      throw "List is incomplete";
    }
    return [...linearizeList(termToString(this.head), this.results)].map(
      (ir) => getCompleteResult(ir) ?? {}
    );
  }
}
