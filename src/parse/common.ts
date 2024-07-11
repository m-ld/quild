import {
  ContextParser,
  type JsonLdContext,
  type JsonLdContextNormalized,
} from "jsonld-context-parser";
import { isArray, isPlainObject as isPlainObject_, isString } from "lodash-es";
import { map } from "rambdax";

import { af } from "../common";
import { evolve, prepend } from "../upstream/rambda";

import type * as IR from "../IntermediateResult";
import type * as RDF from "@rdfjs/types";
import type { Algebra } from "sparqlalgebrajs";
import type { JsonArray, JsonObject, JsonValue } from "type-fest";

export interface ParseWarning {
  message: string;
  path: Array<string | number>;
}

/**
 * An {@link Algebra.Operation} which can sensically be the first input in an
 * {@link Algebra.Project}.
 */
export type ProjectableOperation = Algebra.Join | Algebra.LeftJoin;

export interface Parsed<
  IRType extends IR.IntermediateResult = IR.IntermediateResult
> {
  /** The IR which will accept bindings and produce a result. */
  intermediateResult: IRType;
  /** The operation from which the {@link projections} will be projected. */
  operation: ProjectableOperation;
  /**
   * Variables to project in the SPARQL query. A subset of the variables used
   * in the {@link operation}; specifically, those the {@link intermediateResult}
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

export interface TopLevelGraphContainer extends JsonObject {
  "@context"?: JsonObject;
  "@graph": JsonValue[];
}

export const isTopLevelGraphContainer = (
  element: JsonObject
): element is TopLevelGraphContainer =>
  // "a map consisting of only the entries `@context` and/or `@graph`"
  !Object.keys(element).some((key) => !["@context", "@graph"].includes(key)) &&
  isArray(element["@graph"]) &&
  (isPlainObject(element["@context"]) ||
    isString(element["@context"]) ||
    element["@context"] === undefined ||
    element["@context"] === null);

export const propagateContext = async (
  innerCtxDef: JsonValue | null | undefined,
  outerCtx: JsonLdContextNormalized
) =>
  innerCtxDef === undefined
    ? outerCtx
    : innerCtxDef === null
    ? nullContext
    : /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
         ---
         Needed until we have better types flowing. */
      contextParser.parse(innerCtxDef as JsonLdContext, {
        parentContext: outerCtx.getContextRaw(),
      });

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
  ctx: JsonLdContextNormalized;
}

export const elementMatches = <T, U extends JsonValue>(
  predicate: (x: unknown) => x is T,
  toParse: ToParse<U>
): toParse is ToParse<T & U> => predicate(toParse.element);

export const contextParser = new ContextParser();
export const nullContext = await contextParser.parse({});

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
  operation: af.createJoin([]),
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
  readonly NodeObjectArray: Parse<JsonArray, IR.Array>;
  readonly TopLevelGraphContainer: Parse<TopLevelGraphContainer, IR.Object>;
  readonly NodeObject: Parse<JsonObject, IR.Object>;
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
