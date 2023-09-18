import { map } from "rambdax";

import { toJSONNative } from "./representation";

import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

export class ResultError extends Error {}

const termString = (term: RDF.Term) => `<${term.termType}: ${term.value}>`;

// In the style of Clojure's `update`
// https://clojuredocs.org/clojure.core/update
const update = <K extends keyof O, O extends object>(
  obj: O,
  key: K,
  replaceFn: (previousValue: O[K] | undefined) => O[K]
): O => ({ ...obj, [key]: replaceFn(obj[key]) });

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

export class Plural implements IntermediateResult {
  constructor(
    private readonly variable: RDF.Variable,
    private readonly template: IntermediateResult,
    private readonly results: Record<string, IntermediateResult> = {}
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
      update(this.results, JSON.stringify(v), (ir) =>
        (ir ?? this.template).addSolution(solution)
      )
    );
  }

  result(): JsonValue {
    return Object.values(this.results).map((r) => r.result());
  }
}

export class NodeObject implements IntermediateResult {
  constructor(private readonly results: Record<string, IntermediateResult>) {}

  // TODO: Test
  addMapping(k: string, v: IntermediateResult) {
    return new NodeObject({ ...this.results, [k]: v });
  }

  addSolution(solution: RDF.Bindings): IntermediateResult {
    return new NodeObject(map((ir) => ir.addSolution(solution), this.results));
  }

  result(): JsonValue {
    return map((r) => r.result(), this.results);
  }
}
