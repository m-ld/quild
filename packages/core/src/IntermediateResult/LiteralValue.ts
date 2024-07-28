import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

/**
 * Represents a literal value in the query and result. Will ignore any solutions
 * and simply become its value in the result. The value can be any JSON
 * value---a scalar, an object, or an array. The value should not contain any
 * placeholders, as they will appear in the result.
 *
 * @example
 * ### Query
 * ```json
 * "Luke Skywalker"
 * ```
 *
 * ### Result
 * ```json
 * "Luke Skywalker"
 * ```
 */
export class LiteralValue implements IntermediateResult {
  constructor(private readonly value: JsonValue) {}

  addSolution(_solution: RDF.Bindings): IntermediateResult {
    return this;
  }

  result(): JsonValue {
    return this.value;
  }
}
