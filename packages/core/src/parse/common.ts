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
export type ProjectableOperation =
  | Algebra.Bgp
  | Algebra.Join
  | Algebra.LeftJoin;

export interface Parsed<
  IRType extends IR.IntermediateResult = IR.IntermediateResult,
  TermType extends RDF.Term = RDF.Term
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
  term: TermType;
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

interface TopLevelGraphContainer extends JsonObject {
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

type SetObject = JsonObject & {
  "@set": JsonValue[];
};

export const isSetObject = (element: JsonObject): element is SetObject =>
  isPlainObject(element) && isArray(element["@set"]);

type ListObject = JsonObject & {
  "@list": JsonValue[];
};

export const isListObject = (element: JsonObject): element is ListObject =>
  isPlainObject(element) && isArray(element["@list"]);

export const propagateContext = async (
  innerCtxDef: JsonValue | null | undefined,
  outerCtx: JsonLdContextNormalized
) =>
  innerCtxDef === undefined
    ? outerCtx
    : innerCtxDef === null
    ? contextParser.parse({})
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

export const contextParser = new ContextParser();

/**
 * Make all properties in `T` optional, *except* keys assignable to `K`.
 */
type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

/**
 * Creates a {@link Parsed} with default values.
 */
export const parsed = <
  IRType extends IR.IntermediateResult,
  TermType extends RDF.Term = RDF.Term
>(
  partialParsed: PartialExcept<
    Parsed<IRType, TermType>,
    "intermediateResult" | "term"
  >
): Parsed<IRType, TermType> => ({
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
  IRType extends IR.IntermediateResult = IR.IntermediateResult,
  TermType extends RDF.Term = RDF.Term
> = (
  this: Parser,
  toParse: ToParse<Element>
) => Promise<Parsed<IRType, TermType>>;

/**
 * A Parser contains handlers for each type of element found in a query.
 */
export interface Parser {
  readonly Document: Parse;
  readonly NodeObjectArray: Parse<JsonArray, IR.Set>;
  readonly ListArray: Parse<JsonArray>;
  readonly TopLevelGraphContainer: Parse<TopLevelGraphContainer, IR.Object>;
  readonly NodeObject: Parse<
    JsonObject,
    IR.Object,
    RDF.Variable | RDF.NamedNode
  >;
  readonly GraphObject: Parse;
  readonly ListObject: Parse<ListObject, IR.Object>;
  readonly Primitive: Parse<
    string | number | boolean,
    IR.NativePlaceholder | IR.LiteralValue
  >;
  readonly SetObject: Parse<SetObject, IR.Object>;
  readonly ValueObject: Parse;
  readonly Resource: Parse;
}
