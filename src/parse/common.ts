import jsonld from "jsonld";
import { isPlainObject as isPlainObject_ } from "lodash-es";
import { map } from "rambdax";

import { evolve, prepend } from "../upstream/rambda";

import type * as IR from "../IntermediateResult";
import type * as RDF from "@rdfjs/types";
import type { Algebra } from "sparqlalgebrajs";
import type { JsonArray, JsonObject, JsonValue } from "type-fest";

export interface ParseWarning {
  message: string;
  path: Array<string | number>;
}

export interface Parsed<
  IRType extends IR.IntermediateResult = IR.IntermediateResult
> {
  /** The IR which will accept bindings and produce a result. */
  intermediateResult: IRType;
  /** Patterns to include in the SPARQL query. */
  patterns: Algebra.Pattern[];
  /**
   * Variables to project in the SPARQL query. A subset of the variables used
   * in the {@link patterns}; specifically, those the {@link intermediateResult}
   * is interested in.
   */
  projections: RDF.Variable[];
  /** Warnings generated during parsing. */
  warnings: ParseWarning[];
  /** A term representing the root of the parsed query. */
  term: RDF.Term;
}

/**
 * isPlainObject, but typed to narrow the object to a string record.
 *
 * @see https://github.com/microsoft/TypeScript/issues/17002
 */
/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
   ---
   Allow type correction */
export const isPlainObject = isPlainObject_ as (
  value: unknown
) => value is Record<string, unknown>;

export const nestWarningsUnderKey = (
  key: ParseWarning["path"][number]
): ((
  iterable: ParseWarning[]
) => Array<{ message: string; path: Array<typeof key> }>) =>
  map(
    evolve({
      path: prepend(key)<typeof key>,
    })
  );

/**
 * An object passed to a parsing function with all the contextual information
 * required to provide a result.
 */
export interface ToParse<Element extends JsonValue = JsonValue> {
  /** The query element to parse. */
  element: Element;
  /** The variable representing the node which this query applies to. */
  variable: RDF.Variable;
  /** The context in which to interpret the query. */
  ctx: jsonld.ActiveContext;
}

export const elementMatches = <T, U extends JsonValue>(
  predicate: (x: unknown) => x is T,
  toParse: ToParse<U>
): toParse is ToParse<T & U> => predicate(toParse.element);

/**
 * Returns a null (empty, initial) `ActiveContext`.
 */
export const nullContext = (
  options?: jsonld.ProcessingOptions
): Promise<jsonld.ActiveContext> =>
  // Relies on `jsonld.processContext()` short-circuiting when the local context
  // is `null`. Otherwise, there's no way to get an initial context using the
  // public API.
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
     --
     Only way to make this work. */
  jsonld.processContext(null as unknown as jsonld.ActiveContext, null, options);

/**
 * Make all properties in `T` optional, *except* keys assignable to `K`.
 */
type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

/**
 * Creates a {@link Parsed} with default values.
 */
export const parsed = <IRType extends IR.IntermediateResult>(
  partialParsed: PartialExcept<Parsed<IRType>, "intermediateResult" | "term">
): Parsed<IRType> => ({
  patterns: [],
  projections: [],
  warnings: [],
  ...partialParsed,
});

/**
 * Creates a {@link ParseWarning} with default values.
 */
export const parseWarning = (
  partialParseWarning: PartialExcept<ParseWarning, "message">
): ParseWarning => ({
  path: [],
  ...partialParseWarning,
});

export type Parse<
  Element extends JsonValue = JsonValue,
  IRType extends IR.IntermediateResult = IR.IntermediateResult
> = (this: Parser, toParse: ToParse<Element>) => Promise<Parsed<IRType>>;

/**
 * A Parser contains handlers for each type of element found in a query.
 */
export interface Parser {
  readonly Document: Parse;
  readonly NodeObjectArray: Parse<JsonArray, IR.Plural>;
  readonly TopLevelGraphContainer: Parse;
  readonly NodeObject: Parse<JsonObject, IR.NodeObject>;
  readonly GraphObject: Parse;
  readonly ListObject: Parse;
  readonly Primitive: Parse<
    string | number | boolean,
    IR.NativePlaceholder | IR.NativeValue
  >;
  readonly SetObject: Parse;
  readonly ValueObject: Parse;
  readonly Resource: Parse;
}
