import { LiteralValue } from "./LiteralValue";
import { IncompleteResultError, NotANamedNodeError } from "./errors";

import type { IntermediateResult } from "./types";
import type * as RDF from "@rdfjs/types";
import type { JsonLdContextNormalized } from "jsonld-context-parser";
import type { JsonValue } from "type-fest";

/**
 * Represents a placeholder which expects a JSON-LD/RDF name. When a solution is
 * given binding its variable to an {@link RDF.NamedNode}, it will resolve to
 * the node's name. This distinguishes it from {@link NativePlaceholder}, which
 * represents a native scalar. A string in {@link NamePlaceholder}'s result
 * represents the name of an RDF node, *not* an RDF string value.
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
export class NamePlaceholder implements IntermediateResult {
  constructor(
    private readonly variable: RDF.Variable,
    private readonly ctx: JsonLdContextNormalized,
    private readonly compaction: NamePlaceholder.Compaction
  ) {}

  addSolution(solution: RDF.Bindings): IntermediateResult {
    const value = solution.get(this.variable);

    // If there's no binding for us in the solution, ignore it.
    // TODO: Is this the correct thing to do?
    if (!value) {
      return this;
    }

    if (value.termType !== "NamedNode") {
      throw new NotANamedNodeError(value);
    } else {
      return new LiteralValue(
        this.ctx.compactIri(
          value.value,
          this.compaction === NamePlaceholder.Compaction.VOCAB
        )
      );
    }
  }

  result(): JsonValue {
    throw new IncompleteResultError(this.variable);
  }
}

export namespace NamePlaceholder {
  export enum Compaction {
    BASE = "BASE",
    VOCAB = "VOCAB",
  }
}
