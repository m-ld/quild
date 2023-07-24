import { Map } from "immutable";

import { scalarRepresentation } from "./scalarRepresentation";

import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

export class ResultError extends Error {}

const termString = (term: RDF.Term) => `<${term.termType}: ${term.value}>`;

export class TooManyBindingsError extends ResultError {
  constructor(readonly variable: RDF.Variable, readonly value: RDF.Term) {
    super(
      `Unexpected additional binding ${termString(value)} for ?${
        variable.value
      }`
    );
  }
}

export class IncompleteResultError extends ResultError {
  constructor(readonly variable: RDF.Variable) {
    super(`Result incomplete: No value returned for ?${variable.value}`);
  }
}

export class BadScalarError extends ResultError {
  constructor(readonly variable: RDF.Variable, readonly value: RDF.Term) {
    super(
      `Can't represent ${termString(value)} as a scalar for ?${variable.value}`
    );
  }
}

export interface IntermediateResult {
  addSolution(solution: RDF.Bindings): IntermediateResult;
  result(): JsonValue;
}

export class Scalar implements IntermediateResult {
  constructor(
    private readonly variable: RDF.Variable,
    private readonly value?: RDF.Term
  ) {}

  addSolution(solution: RDF.Bindings): IntermediateResult {
    const v = solution.get(this.variable);

    // If there's no binding for us in the solution, ignore it.
    // TODO: Is this the correct thing to do?
    if (!v) {
      return this;
    }

    if (this.value && !this.value.equals(v)) {
      throw new TooManyBindingsError(this.variable, v);
    }

    return new Scalar(this.variable, v);
  }

  result(): JsonValue {
    if (this.value) {
      const rep = scalarRepresentation(this.value);
      if (rep) {
        return rep;
      } else {
        throw new BadScalarError(this.variable, this.value);
      }
    } else {
      throw new IncompleteResultError(this.variable);
    }
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

    // If there's no binding for us in the solution, ignore it.
    // TODO: Is this the correct thing to do?
    if (!v) {
      return this;
    }

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
