/* eslint-disable @typescript-eslint/no-throw-literal
   ---
   TODO: https://github.com/m-ld/xql/issues/15 */
import { Map } from "immutable";
import jsonld, { type ContextSpec, type ActiveContext } from "jsonld";
import Context from "jsonld/lib/context";
import { isUndefined, isString, isNumber, isBoolean, isArray } from "lodash-es";
import { mapParallelAsync, reduce, toPairs, concat, filter } from "rambdax";

import {
  isPlainObject,
  nestWarningsUnderKey,
  type Parsed,
  type QueryInfo,
} from "./common";
import { parseNode } from "./parseNode";
import * as IR from "../IntermediateResult";
import { af, df, PLACEHOLDER } from "../common";
import { toRdfLiteral } from "../representation";
import { evolve, keys, pipedAsync, anyPass, partial } from "../upstream/rambda";
import { variableUnder } from "../variableUnder";

import type * as RDF from "@rdfjs/types";
import type { JsonValue } from "type-fest";

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

const isLiteral = anyPass([isString, isNumber, isBoolean]);

const addMapping =
  (k: string, v: IR.IntermediateResult) => (ir: IR.NodeObject) =>
    ir.addMapping(k, v);

const isId = (ctx: ActiveContext, k: string) =>
  Context.expandIri(ctx, k, { vocab: true }) === "@id";

export const parseNodeObject = async ({
  query,
  variable,
  ctx: outerCtx,
}: QueryInfo<Record<string, unknown>>): Promise<Parsed<IR.NodeObject>> => {
  const ctx =
    "@context" in query
      ? /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
         ---
         Goes away when we switch to jsonld-context-parser. */
        await jsonld.processContext(outerCtx, query["@context"] as ContextSpec)
      : outerCtx;

  const [idKey, ...extraIdKeys] = filter(partial(isId, ctx), keys(query));

  if (extraIdKeys.length)
    throw "TODO: Invalid JSON-LD syntax; colliding keywords detected.";
  const id = idKey && query[idKey];
  if (!isUndefined(id) && !isString(id)) throw "TODO: Name must be a string";
  const node = id ? df.namedNode(id) : variable;

  const init: Parsed<IR.NodeObject> = {
    intermediateResult: new IR.NodeObject(Map()),
    patterns: [],
    projections: [],
    warnings: [],
    term: variable,
  };

  const operationForEntry = async ([key, value]: [
    key: string,
    value: unknown
  ]): Promise<(p: Parsed<IR.NodeObject>) => Parsed<IR.NodeObject>> => {
    const childVariable = variableUnder(variable, key);

    const { intermediateResult, patterns, projections, warnings } =
      await parseEntry({
        query: [key, value],
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
    query,
    toPairs,
    mapParallelAsync(operationForEntry),
    reduce((acc, f) => f(acc), init)
  );
};

type ParsedEntry = Omit<Parsed, "term">;

const parseEntry = async ({
  query,
  variable,
  ctx,
  node,
}: {
  query: [key: string, value: unknown];
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

  return parseDataEntry({
    query: value,
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

const parsePrimitive = ({
  query,
  variable,
}: QueryInfo<string | number | boolean>): Parsed =>
  isPlaceholder(query)
    ? {
        intermediateResult: new IR.NativePlaceholder(variable),
        patterns: [],
        projections: [variable],
        warnings: [],
        term: variable,
      }
    : {
        intermediateResult: new IR.NativeValue(query),
        patterns: [],
        projections: [],
        warnings: [],
        term: toRdfLiteral(query),
      };

/**
 * A QueryInfo specifically for parsing data entries.
 */
interface DataEntryInfo<Query> extends QueryInfo<Query> {
  /** The node which this entry belongs to. */
  node: RDF.Variable | RDF.NamedNode;
  /** The predicate between the node and what this query applies to */
  predicate: RDF.NamedNode;
}

const parseDataEntry = async ({
  query,
  variable,
  ctx,
  node,
  predicate,
}: DataEntryInfo<unknown>): Promise<ParsedEntry> => {
  let parsedChild;

  if (isLiteral(query)) {
    parsedChild = parsePrimitive({ query, variable, ctx });
  } else if (isArray(query) || isPlainObject(query)) {
    parsedChild = await parseNode({ query, variable, ctx });
  } else {
    throw "TODO: Not yet covered";
  }

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
