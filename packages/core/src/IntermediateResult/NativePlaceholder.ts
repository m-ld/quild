import { isUndefined } from "lodash-es";

import { LiteralValue } from "./LiteralValue";
import { BadNativeValueError, IncompleteResultError } from "./errors";
import { toJSONNative } from "../representation";

import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

/**
 * Represents a placeholder which expects a JSON-LD literal. When a solution is
 * given binding its variable to an {@link RDF.Literal} which can be represented
 * as a JSON literal, it will resolve to the literal representation. Note that
 * not all RDF literals can be represented as JSON literals; if a literal must
 * be represented in JSON-LD as an object, that object will use an
 * {@link IRObject} placeholder, since it will take that shape in the query and
 * the result.
 *
 * @example
 * ### Query
 * ```json
 * { "@id": "?" }
 * ```
 *
 * ### Result
 * ```json
 * { "@id": "https://swapi.dev/api/people/1/" }
 * ```
 */
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
