import { type Collection, Map } from "immutable";
import { type Algebra } from "sparqlalgebrajs";

import { df } from "./common";
import nativeRepresentation from "./nativeRepresentation";

import type * as RDF from "@rdfjs/types";
import type * as JsonLD from "jsonld";
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

export class BadNameError extends ResultError {
  constructor(readonly value: RDF.Term) {
    super(`Expected ${termString(value)} to be a NamedNode`);
  }
}

export interface IntermediateResult {
  addSolution(solution: RDF.Bindings): IntermediateResult;
  result(): JsonValue;
}

export class NativePlaceholder implements IntermediateResult {
  constructor(private readonly variable: RDF.Variable) {}

  addSolution(solution: RDF.Bindings): IntermediateResult {
    const v = solution.get(this.variable);

    // If there's no binding for us in the solution, ignore it.
    // TODO: Is this the correct thing to do?
    if (!v) {
      return this;
    }

    return new NativeValue(v);
  }

  result(): JsonValue {
    throw new IncompleteResultError(this.variable);
  }
}

export class NativeValue implements IntermediateResult {
  constructor(private readonly value: RDF.Term) {}

  addSolution(_solution: RDF.Bindings): IntermediateResult {
    return this;
  }

  result(): JsonValue {
    const rep = nativeRepresentation(this.value);
    if (rep) {
      return rep;
    } else {
      throw new BadNativeValueError(this.value);
    }
  }
}

export class Name implements IntermediateResult {
  constructor(private readonly value: RDF.Term) {}

  addSolution(_solution: RDF.Bindings): IntermediateResult {
    return this;
  }

  result(): JsonValue {
    if (this.value.termType === "NamedNode") {
      return this.value.value;
    } else {
      throw new BadNameError(this.value);
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
  constructor(
    private readonly results: Map<string, IntermediateResult>,
    private readonly context?: JsonLD.NodeObject["@context"]
  ) {}

  // TODO: Test
  addMapping(k: string, v: IntermediateResult) {
    return new NodeObject(this.results.set(k, v), this.context);
  }

  addSolution(solution: RDF.Bindings): IntermediateResult {
    return new NodeObject(
      this.results.map((ir) => ir.addSolution(solution)),
      this.context
    );
  }

  result(): JsonValue {
    const propertyResults = this.results.map((r) => r.result()).toObject();
    if (this.context) {
      return { "@context": this.context, ...propertyResults };
    }
    return propertyResults;
  }
}
