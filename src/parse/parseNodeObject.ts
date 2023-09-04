/* eslint-disable @typescript-eslint/no-throw-literal
   ---
   TODO: https://github.com/m-ld/xql/issues/15 */

import { Map } from "immutable";
import jsonld, { type ContextSpec, type ActiveContext } from "jsonld";
import Context from "jsonld/lib/context";
import { isUndefined, isString, isNumber, isBoolean } from "lodash-es";
import { mapParallelAsync, reduce, toPairs, concat, filter } from "rambdax";

import {
  nestWarningsUnderKey,
  parsed,
  type Parser,
  type Parsed,
  type ToParse,
} from "./common";
import { parseIriEntryValue } from "./parseIriEntryValue";
import * as IR from "../IntermediateResult";
import { af, df, PLACEHOLDER } from "../common";
import { toRdfLiteral } from "../representation";
import { evolve, keys, pipedAsync, anyPass, partial } from "../upstream/rambda";
import { variableUnder } from "../variableUnder";

import type * as RDF from "@rdfjs/types";
import type { JsonObject, JsonValue } from "type-fest";

const isAbsoluteIri = (x: string): boolean => x.includes(":");

/**
 * Returns a `NamedNode` predicate for the given key, expanded under the given
 * context, or `null` if the key does not expand to an absolute IRI.
 * @param key The key to expand.
 * @param ctx The context under which to expand the key.
 */
const predicateForKey = (key: string, ctx: jsonld.ActiveContext) => {
  const expanded = Context.expandIri(ctx, key, { vocab: true });
  return isAbsoluteIri(expanded) ? df.namedNode(expanded) : null;
};

const isPlaceholder = (v: unknown): v is typeof PLACEHOLDER =>
  v === PLACEHOLDER;

export const isLiteral = anyPass([isString, isNumber, isBoolean]);

const addMapping =
  (k: string, v: IR.IntermediateResult) => (ir: IR.NodeObject) =>
    ir.addMapping(k, v);

const isId = (ctx: ActiveContext, k: string) =>
  Context.expandIri(ctx, k, { vocab: true }) === "@id";

/**
 * Parse a JSON-LD Node Object.
 *
 * @see https://www.w3.org/TR/json-ld11/#node-objects
 */
export const parseNodeObject = async ({
  element,
  variable,
  ctx: outerCtx,
}: ToParse<JsonObject>): Promise<Parsed<IR.NodeObject>> => {
  const ctx =
    "@context" in element
      ? await jsonld.processContext(
          outerCtx,
          /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
             ---
             Goes away when we switch to jsonld-context-parser. */
          element["@context"] as ContextSpec
        )
      : outerCtx;

  const [idKey, ...extraIdKeys] = filter(partial(isId, ctx), keys(element));

  if (extraIdKeys.length)
    throw "TODO: Invalid JSON-LD syntax; colliding keywords detected.";
  const id = idKey && element[idKey];
  if (!isUndefined(id) && !isString(id)) throw "TODO: Name must be a string";
  const node = id ? df.namedNode(id) : variable;

  const operationForEntry = async ([key, value]: [
    key: string,
    value: unknown
  ]): Promise<(p: Parsed<IR.NodeObject>) => Parsed<IR.NodeObject>> => {
    const childVariable = variableUnder(variable, key);

    const { intermediateResult, patterns, projections, warnings } =
      await parseEntry({
        /* eslint-disable-next-line
             @typescript-eslint/consistent-type-assertions
           ---
           Assume all the values are JsonValues. Technically, TS can't enforce
           this for us, because it doesn't do exact types. */
        query: [key, value as JsonValue],
        variable: childVariable,
        ctx,
        node,
      });

    return evolve({
      intermediateResult: addMapping(key, intermediateResult),
      patterns: concat(patterns),
      projections: concat(projections),
      warnings: concat(nestWarningsUnderKey(key)(warnings)),
    });
  };

  return pipedAsync(
    element,
    toPairs,
    mapParallelAsync(operationForEntry),
    reduce(
      (acc, f) => f(acc),
      parsed({
        intermediateResult: new IR.NodeObject(Map()),
        term: variable,
      })
    )
  );
};

type ParsedEntry = Omit<Parsed, "term">;

const parseEntry = async ({
  query,
  variable,
  ctx,
  node,
}: {
  query: [key: string, value: JsonValue];
  variable: RDF.Variable;
  ctx: ActiveContext;
  node: RDF.Variable | RDF.NamedNode;
}): Promise<ParsedEntry> => {
  const [key, value] = query;

  if (key === "@context") {
    return parseContextEntry({ query: value });
  }

  if (isId(ctx, key)) {
    return parseIdEntry({ query: value });
  }

  const predicate = predicateForKey(key, ctx);

  if (!predicate) {
    // Key is not defined in the context.
    return parseUnknownKeyEntry({ query: value });
  }

  return parseIriEntry({
    element: value,
    variable,
    ctx,
    node,
    predicate,
  });
};

const parseContextEntry = ({ query }: { query: unknown }): ParsedEntry => ({
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
     ---
     TODO: https://github.com/m-ld/xql/issues/15 */
  intermediateResult: new IR.NativeValue(query as JsonValue),
  patterns: [],
  projections: [],
  warnings: [],
});

const parseIdEntry = ({ query }: { query: unknown }): ParsedEntry => {
  if (!isString(query)) throw "TODO: Name must be a string";
  return {
    intermediateResult: new IR.Name(df.namedNode(query)),
    patterns: [],
    projections: [],
    warnings: [],
  };
};

const parseUnknownKeyEntry = ({ query }: { query: unknown }): ParsedEntry => ({
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
     ---
     TODO: https://github.com/m-ld/xql/issues/15 */
  intermediateResult: new IR.NativeValue(query as JsonValue),
  patterns: [],
  projections: [],
  warnings: [
    {
      message: "Key not defined by context and ignored",
      path: [],
    },
  ],
});

export const parsePrimitive: Parser<
  string | number | boolean,
  IR.NativePlaceholder | IR.NativeValue
> = ({ element: query, variable }) =>
  Promise.resolve(
    isPlaceholder(query)
      ? parsed({
          intermediateResult: new IR.NativePlaceholder(variable),
          projections: [variable],
          term: variable,
        })
      : parsed({
          intermediateResult: new IR.NativeValue(query),
          term: toRdfLiteral(query),
        })
  );

/**
 * A QueryInfo specifically for parsing data entries.
 */
interface DataEntryInfo<Query extends JsonValue = JsonValue>
  extends ToParse<Query> {
  /** The node which this entry belongs to. */
  node: RDF.Variable | RDF.NamedNode;
  /** The predicate between the node and what this query applies to */
  predicate: RDF.NamedNode;
}

const parseIriEntry = async ({
  element,
  variable,
  ctx,
  node,
  predicate,
}: DataEntryInfo): Promise<ParsedEntry> => {
  const parsedChild = await parseIriEntryValue({ element, variable, ctx });

  return {
    intermediateResult: parsedChild.intermediateResult,
    patterns: [
      af.createPattern(node, predicate, parsedChild.term),
      ...parsedChild.patterns,
    ],
    projections: parsedChild.projections,
    warnings: parsedChild.warnings,
  };
};
