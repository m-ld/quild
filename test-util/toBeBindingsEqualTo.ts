import { BindingsFactory, type Bindings } from "@comunica/bindings-factory";
import { expect } from "@jest/globals";
import { type Term } from "@rdfjs/types";
import { type MatcherFunction } from "expect";
import matchers from "expect/build/matchers";
import { identity, sortBy, zip } from "lodash-es";
import { DataFactory } from "rdf-data-factory";
import { type Variable } from "rdf-data-factory";
import { stringToTerm, termToString } from "rdf-string";
import { type ColumnUserConfig, table } from "table";

// This module's ES module compat is broken, but it's hard to make a case for
// fixing it, because we're probably not supposed to use it to begin with.
const toBe = matchers.default.toBe;

// Note: You'll see the unfortunate word "bindingses" in this module. That
// refers to an instance of `Bindings[]`.

/**
 * Make all properties in T *not* readonly
 */
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

type ExpectedBindings = string[][];

const isBindings = (o: unknown): o is Bindings =>
  !!o && typeof o === "object" && "type" in o && o.type === "bindings";

const isIterable = (o: unknown): o is Iterable<unknown> =>
  !!o &&
  typeof o === "object" &&
  Symbol.iterator in o &&
  typeof o[Symbol.iterator] === "function";

// NOTE: Actually iterates over the iterable.
const isIterableOf = <E>(
  o: unknown,
  predicate: (e: unknown) => e is E
): o is Iterable<E> => {
  if (!isIterable(o)) return false;
  for (const element of o) {
    if (!predicate(element)) return false;
  }
  return true;
};

/** Returns true if the two sets of bindings contain the same information. */
const bindingsesMatch = (
  actual: Readonly<Bindings>[],
  expected: Readonly<Bindings>[]
) => {
  const sortedBindingses = (
    bindings: Readonly<Bindings>[]
  ): Readonly<Bindings>[] =>
    sortBy(bindings, (b) =>
      sortBy([...b.keys()], (v) => v.value).map((v) => termToString(b.get(v)))
    );

  const sortedActual = sortedBindingses(actual);
  const sortedExpected = sortedBindingses(expected);

  // Maps blank node names from the expected bindings to the blank nodes in the
  // actual bindings.
  const actualBlankNodes = new Map<string, Term>();

  return !zip(sortedActual, sortedExpected).find(([a, e]) => {
    if (a === undefined || e === undefined)
      return !(a === undefined && e === undefined);

    return [...e].find(([variable, expectedTerm]) => {
      const actualTerm = a.get(variable);
      if (!actualTerm) return true;
      if (expectedTerm.termType === "BlankNode") {
        if (actualTerm.termType !== "BlankNode") return true;
        if (actualBlankNodes.has(expectedTerm.value))
          return !actualBlankNodes.get(expectedTerm.value)?.equals(actualTerm);

        actualBlankNodes.set(expectedTerm.value, actualTerm);
        return false;
      }
      return !actualTerm.equals(expectedTerm);
    });
  });
};

const NOT_FOUND = -1;
/**
 * Returns an array of tables (as strings) presenting each bindingses given.
 * The column widths will match across all tables, to make it easier to compare
 * multple tables generated at once.
 */
export const bindingsTables = <BindingsesList extends Bindings[][]>(
  bindingseses: BindingsesList,
  /**
   * The columns will be ordered by these variable names. Variables not
   * mentioned will appear in alphabetical order after these.
   */
  columnOrder: string[] = []
): { [I in keyof BindingsesList]: string } => {
  const allVariableNames = new Set<string>();

  for (const bindingses of bindingseses) {
    for (const variable of [...(bindingses[0]?.keys() ?? [])]) {
      allVariableNames.add(variable.value);
    }
  }

  const sortedVariableNames = sortBy(
    [...allVariableNames],
    [
      (varName) => {
        const index = columnOrder.indexOf(varName);
        return index === NOT_FOUND ? columnOrder.length : index;
      },
      identity,
    ]
  );

  // Tracks the longest widths of cells across both actual and expected, so they
  // match.
  const columnsConfig: Record<number, Mutable<ColumnUserConfig>> = {};

  const tableData = (bindingses: Bindings[]) => [
    sortedVariableNames,
    ...sortBy(
      bindingses.map((b) =>
        sortedVariableNames.map((varName, i) => {
          const value = termToString(b.get(varName)) ?? "";
          const columnConfig = (columnsConfig[i] = columnsConfig[i] ?? {});
          columnConfig.width = Math.max(
            columnConfig.width ?? 0,
            value.length,
            varName.length
          );
          return value;
        })
      )
    ),
  ];

  const makeTable = (data: string[][]) =>
    `${data.length - 1} bindings:\n${table(data, {
      columns: columnsConfig,
    })}`;

  const tables = bindingseses.map(tableData).map(makeTable);

  // TypeScript isn't great at preserving tuple types through maps. We'll just
  // assert to TS that we have this right (while letting it confirm that the
  // value is at least a `string[]`).
  return tables satisfies string[] as {
    [I in keyof BindingsesList]: string;
  };
};

/* eslint-disable @typescript-eslint/no-invalid-this
   --
  `MatcherFunction` defines the type of `this`, but
  `@typescript-eslint/no-invalid-this` doesn't recognize it.
 */
export const toBeBindingsEqualTo: MatcherFunction<
  [expectedBindings: ExpectedBindings]
> = function (actual, expected) {
  if (!isIterableOf(actual, isBindings)) {
    throw new Error(
      `Expected a bindings collection, but got: ${this.utils.stringify(actual)}`
    );
  }

  const df = new DataFactory();
  const bf = new BindingsFactory(df);

  const actualBindingses = [...actual];

  const [expectedVariableNames = [], ...expectedBindingRows] = expected;

  const expectedBindingses = expectedBindingRows.map((row) =>
    bf.bindings(
      expectedVariableNames
        .map<[Variable, Term] | undefined>((name, i) => {
          // We use stringToTerm() to parse the given value, *except*:
          // - `stringToTerm("")` returns a `DefaultGraph`; we want a literal.
          // - `stringToTerm(undefined)` also returns a `DefaultGraph`; we want
          //   to simply skip such a binding.
          const termString = row[i];
          if (termString === undefined) return undefined;
          return [
            df.variable(name),
            termString === "" ? df.literal("") : stringToTerm(termString),
          ];
        })
        .filter(<T>(e: T | undefined): e is T => !!e)
    )
  );

  const pass = bindingsesMatch(actualBindingses, expectedBindingses);

  const [actualTable, expectedTable] = bindingsTables(
    [actualBindingses, expectedBindingses],
    expectedVariableNames
  );

  return {
    ...toBe.call(this, actualTable, expectedTable),
    pass,
  };
};
/* eslint-enable @typescript-eslint/no-invalid-this -- ^^^ */

expect.extend({ toBeBindingsEqualTo });

declare module "expect" {
  interface AsymmetricMatchers {
    toBeBindingsEqualTo(
      expectedBindings: ExpectedBindings
    ): AsymmetricMatcher<string>;
  }

  interface Matchers<R> {
    toBeBindingsEqualTo(expectedBindings: ExpectedBindings): R;
  }
}