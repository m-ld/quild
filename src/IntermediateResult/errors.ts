import type * as RDF from "@rdfjs/types";

const termString = (term: RDF.Term) => `<${term.termType}: ${term.value}>`;

export class ResultError extends Error {}

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

export class NotANamedNodeError extends ResultError {
  constructor(readonly value: RDF.Term) {
    super(`Expected a NamedNode, but got ${termString(value)}`);
  }
}
