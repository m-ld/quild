import { map } from "rambdax";

import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonObject } from "type-fest";

/**
 * Represents a JSON object in the query and result, distributing the solutions
 * over the object's entries.
 *
 * @example
 * ### Query
 * ```json
 * {
 *   "@context": { "@vocab": "http://swapi.dev/documentation#" },
 *   "eye_color": "blue",
 *   "name": "?",
 *   "homeworld": {
 *     name: "?",
 *   },
 * }
 * ```
 *
 * ### Result
 * ```json
 * {
 *   "@context": { "@vocab": "http://swapi.dev/documentation#" },
 *   "eye_color": "blue",
 *   "name": "Luke Skywalker",
 *   "homeworld": {
 *     name: "Tatooine",
 *   },
 * }
 * ```
 */
// Named `IRObject` to avoid conflict with the global `Object` type. Used as
// `IR.Object` elsewhere.
export class IRObject implements IntermediateResult {
  constructor(private readonly results: Record<string, IntermediateResult>) {}

  // TODO: Test
  addMapping(k: string, v: IntermediateResult) {
    return new IRObject({ ...this.results, [k]: v });
  }

  addSolution(solution: RDF.Bindings): IntermediateResult {
    return new IRObject(map((ir) => ir.addSolution(solution), this.results));
  }

  result(): JsonObject {
    return map((r) => r.result(), this.results);
  }
}
