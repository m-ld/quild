import { Map } from "immutable";

import { toJSONNative } from "./representation";

import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

export class ResultError extends Error {}

const termString = (term: RDF.Term) => `<${term.termType}: ${term.value}>`;

export class IncompleteResultError extends ResultError {
  constructor(readonly variable: RDF.Variable) {
    super(`Result incomplete: No value returned for ?${variable.value}`);
  }
}

export class BadNativeValueError extends ResultError {
  constructor(readonly value: RDF.Term) {
    super(`Can't represent ${termString(value)} as a native JSON value`);
  }
}

export interface IntermediateResult {
  addSolution(solution: RDF.Bindings): IntermediateResult;
  result(): JsonValue;
}

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
    if (rep) {
      return new NativeValue(rep);
    } else {
      throw new BadNativeValueError(value);
    }
  }

  result(): JsonValue {
    throw new IncompleteResultError(this.variable);
  }
}

export class NativeValue implements IntermediateResult {
  constructor(private readonly value: JsonValue) {}

  addSolution(_solution: RDF.Bindings): IntermediateResult {
    return this;
  }

  result(): JsonValue {
    return this.value;
  }
}

export class Name implements IntermediateResult {
  constructor(private readonly value: RDF.NamedNode) {}

  addSolution(_solution: RDF.Bindings): IntermediateResult {
    return this;
  }

  result(): JsonValue {
    return this.value.value;
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

  // TODO: Test
  addMapping(k: string, v: IntermediateResult) {
    return new NodeObject(this.results.set(k, v));
  }

  addSolution(solution: RDF.Bindings): IntermediateResult {
    return new NodeObject(this.results.map((ir) => ir.addSolution(solution)));
  }

  result(): JsonValue {
    return this.results.map((r) => r.result()).toObject();
  }
}
