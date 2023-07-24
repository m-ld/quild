/* eslint-disable @typescript-eslint/no-throw-literal */
import { Map } from "immutable";

import { scalarRepresentation } from "./scalarRepresentation";

import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

export interface IntermediateResult {
  addSolution(solution: RDF.Bindings): IntermediateResult;
  result(): JsonValue;
}

export class Literal implements IntermediateResult {
  constructor(private readonly literal: RDF.Literal) {}

  addSolution(_solution: RDF.Bindings): IntermediateResult {
    // Ignore additional solutions.
    // TODO: Is this correct?
    return this;
  }

  result() {
    return scalarRepresentation(this.literal);
  }
}

export class Scalar implements IntermediateResult {
  constructor(private readonly variable: RDF.Variable) {}

  addSolution(solution: RDF.Bindings): IntermediateResult {
    const r = solution.get(this.variable);
    if (r?.termType === "Literal") {
      return new Literal(r);
    }

    throw "TODO: Not covered yet";
  }

  result(): JsonValue {
    throw "TODO: Shouldn't get here";
  }
}

export class Plural implements IntermediateResult {
  constructor(
    private readonly variable: RDF.Variable,
    private readonly template: IntermediateResult,
    private readonly results: Map<string, IntermediateResult> = Map()
  ) {}

  addSolution(solution: RDF.Bindings): IntermediateResult {
    const v = solution.get(this.variable);

    if (!v) throw "TODO: Not covered yet";

    return new Plural(
      this.variable,
      this.template,
      this.results.update(JSON.stringify(v), this.template, (ir) =>
        ir.addSolution(solution)
      )
    );
  }

  result(): JsonValue {
    return this.results
      .valueSeq()
      .map((r) => r.result())
      .toArray();
  }
}

export class NodeObject implements IntermediateResult {
  constructor(private readonly results: Map<string, IntermediateResult>) {}

  addSolution(solution: RDF.Bindings): IntermediateResult {
    const newResults = this.results.map((ir) => ir.addSolution(solution));

    return new NodeObject(newResults);
  }

  result(): JsonValue {
    return this.results.map((r) => r.result()).toObject();
  }
}
