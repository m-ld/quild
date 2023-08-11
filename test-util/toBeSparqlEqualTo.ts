import { expect } from "@jest/globals";
import matchers from "expect/build/matchers";
import { uniqWith } from "rambdax";
import { Algebra, toSparql } from "sparqlalgebrajs";
import sparqljs from "sparqljs";

import type {
  MatcherFunction,
  MatcherUtils,
  Tester,
  TesterContext,
} from "expect";
import type { BgpPattern, SelectQuery, SparqlQuery } from "sparqljs";
import type { ReadonlyDeep } from "type-fest";

/* eslint-disable-next-line import/no-named-as-default-member
   ---
   sparqljs's ES module compat is broken until this is merged:
   https://github.com/RubenVerborgh/SPARQL.js/pull/171 */
const { Parser, Generator } = sparqljs;

// This module's ES module compat is even weirder, but it's hard to make a case
// for fixing it, because we're probably not supposed to use it to begin with.
const toBe = matchers.default.toBe;

// PRed as: https://github.com/DefinitelyTyped/DefinitelyTyped/pull/65054
declare module "sparqljs" {
  interface Update {
    base?: string | undefined;
  }
}

declare module "sparqlalgebrajs" {
  export function toSparqlJs(op: Algebra.Operation): SparqlQuery;
}

const isSparqlAlgebraOperation = (o: unknown): o is Algebra.Operation =>
  !!o &&
  typeof o === "object" &&
  "type" in o &&
  Object.values<unknown>(Algebra.types).includes(o.type);

const isSparqlJsSparqlQuery = (o: unknown): o is SparqlQuery =>
  !!o &&
  typeof o === "object" &&
  "type" in o &&
  (o.type === "query" || o.type === "update");

/**
 * Normalize the given SPARQL (whether string, Algebra, or SparqlJS) as
 * SparqlJS's stringification, with the given base and prefixes if given.
 */
const normalized = ({
  value,
  name,
  base,
  prefixes,
  stringify,
}: {
  value: unknown;
  name: string;
  stringify: MatcherUtils["utils"]["stringify"];
  /** `base: null` means "remove the base" */
  base?: SparqlQuery["base"] | null;
  prefixes?: SparqlQuery["prefixes"];
}): {
  sparqlJs: SparqlQuery;
  string: string;
  base?: SparqlQuery["base"];
  prefixes: SparqlQuery["prefixes"];
} => {
  if (
    !(
      typeof value === "string" ||
      isSparqlAlgebraOperation(value) ||
      isSparqlJsSparqlQuery(value)
    )
  ) {
    throw new Error(
      `${name} value should be SPARQL algebra, SparqlJS, or string, but was: ${stringify(
        value
      )}`
    );
  }

  const generator = new Generator();
  const parser = new Parser();

  // Always coerce to a string first, then parse with SparqlJS, then generate a
  // string again with SparqlJS. The SparqlJS parser manipulates blank nodes in
  // such a way that the only way to make matching possible is to always run
  // through it.

  const incomingSparqlString = isSparqlAlgebraOperation(value)
    ? toSparql(value)
    : isSparqlJsSparqlQuery(value)
    ? generator.stringify(value)
    : value;

  const sparqlJs = parser.parse(incomingSparqlString);

  if (base) sparqlJs.base = base;
  if (base === null) delete sparqlJs.base;
  if (prefixes) sparqlJs.prefixes = prefixes;

  return {
    sparqlJs,
    string: generator.stringify(sparqlJs),
    base: sparqlJs.base,
    prefixes: sparqlJs.prefixes,
  };
};

/* eslint-disable @typescript-eslint/no-invalid-this
   --
  `MatcherFunction` defines the type of `this`, but
  `@typescript-eslint/no-invalid-this` doesn't recognize it.
 */
const toBeSparqlEqualTo: MatcherFunction<[expectedSparql: unknown]> = function (
  actual,
  expected
) {
  // Take the base and prefixes from the expected value...
  const {
    sparqlJs: expectedSparqlJs,
    string: expectedString,
    base,
    prefixes,
  } = normalized({
    value: expected,
    name: "Expected",
    stringify: this.utils.stringify,
  });

  // ...and use them when formatting the actual value.
  const { sparqlJs: actualSparqlJs, string: actualString } = normalized({
    value: actual,
    name: "Actual",
    stringify: this.utils.stringify,
    base: base ?? null,
    prefixes,
  });

  const isBGP = (x: unknown): x is BgpPattern =>
    !!x &&
    typeof x === "object" &&
    "type" in x &&
    x.type === "bgp" &&
    "triples" in x &&
    x.triples instanceof Array;

  function areBGPsEqual(
    this: TesterContext,
    a: unknown,
    b: unknown,
    customTesters: Tester[]
  ) {
    if (isBGP(a) && isBGP(b)) {
      return orderIndependentEquals(
        (x, y) => this.equals(x, y, customTesters),
        a.triples,
        b.triples
      );
    }
  }

  const isSelectQuery = (x: unknown): x is SelectQuery =>
    !!x &&
    typeof x === "object" &&
    "queryType" in x &&
    x.queryType === "SELECT" &&
    "variables" in x &&
    x.variables instanceof Array;

  function areSelectQueriesEqual(
    this: TesterContext,
    a: unknown,
    b: unknown,
    customTesters: Tester[]
  ) {
    if (isSelectQuery(a) && isSelectQuery(b)) {
      const { variables: aVariables, ...aRest } = a;
      const { variables: bVariables, ...bRest } = b;
      return (
        this.equals(aRest, bRest, customTesters) &&
        orderIndependentEquals(
          (x, y) => this.equals(x, y, customTesters),
          aVariables,
          bVariables
        )
      );
    }
  }

  return {
    ...toBe.call(this, actualString, expectedString),
    pass: this.equals(expectedSparqlJs, actualSparqlJs, [
      areBGPsEqual,
      areSelectQueriesEqual,
    ]),
  };
};
/* eslint-enable @typescript-eslint/no-invalid-this -- ^^^ */

expect.extend({ toBeSparqlEqualTo });

declare module "expect" {
  interface AsymmetricMatchers {
    toBeSparqlEqualTo(
      expectedSparql: string | Algebra.Operation | ReadonlyDeep<SparqlQuery>
    ): AsymmetricMatcher<string>;
  }

  interface Matchers<R> {
    toBeSparqlEqualTo(
      expectedSparql: string | Algebra.Operation | ReadonlyDeep<SparqlQuery>
    ): R;
  }
}

/**
 * Returns whether the two given arrays contain the same values, as defined by
 * the given predicate.
 * @param aValues One array of values to compare
 * @param bValues The other array of values to compare
 * @param predicate Returns true iff the given elements should be considered
 * equal for the comparison.
 */
const orderIndependentEquals = (
  predicate: (x: unknown, y: unknown) => boolean,
  aValues: unknown[],
  bValues: unknown[]
) =>
  aValues.length === bValues.length &&
  aValues.length === uniqWith(predicate, [...aValues, ...bValues]).length;
