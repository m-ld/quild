/* eslint-disable @typescript-eslint/no-throw-literal */
import { Map } from "immutable";
import jsonld, { type ActiveContext } from "jsonld";
import Context from "jsonld/lib/context";
import {
  isObject,
  isUndefined,
  isString,
  isNumber,
  isBoolean,
} from "lodash-es";
import { mapParallelAsync, reduce, toPairs, concat, filter } from "rambdax";
import { type NamedNode } from "rdf-data-factory";

import { isArray, nestWarningsUnderKey, type Parsed } from "./common";
import { parsePlural } from "./parsePlural";
import * as IR from "../IntermediateResult";
import { af, df, PLACEHOLDER } from "../common";
import { toRdfLiteral } from "../representation";
import { evolve, keys, pipedAsync, anyPass } from "../upstream/rambda";
import { partial } from "../upstream/rambda/partial";
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

// TODO:
// - "parent" doesn't seem like the right name

export const parseNodeObject = async (
  query: jsonld.NodeObject,
  parent: RDF.Variable,
  outerCtx: ActiveContext
): Promise<Parsed<IR.NodeObject>> => {
  const ctx = query["@context"]
    ? await jsonld.processContext(outerCtx, query["@context"])
    : outerCtx;

  const [idKey, ...extraIdKeys] = filter(partial(isId, ctx), keys(query));

  if (extraIdKeys.length)
    throw "TODO: Invalid JSON-LD syntax; colliding keywords detected.";
  const id = idKey && query[idKey];
  if (!isUndefined(id) && !isString(id)) throw "TODO: Name must be a string";
  const node = id ? df.namedNode(id) : parent;

  const init: Parsed<IR.NodeObject> = {
    intermediateResult: new IR.NodeObject(Map()),
    patterns: [],
    projections: [],
    warnings: [],
  };

  const operationForEntry = async ([key, value]: [
    key: string,
    value: unknown
  ]): Promise<(p: Parsed<IR.NodeObject>) => Parsed<IR.NodeObject>> => {
    const { intermediateResult, patterns, projections, warnings } =
      await parseEntry([key, value], parent, ctx, node);

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

const parseEntry = async (
  [key, value]: [key: string, value: unknown],
  parent: RDF.Variable,
  ctx: ActiveContext,
  node: RDF.Variable | NamedNode
): Promise<Parsed<IR.IntermediateResult>> => {
  if (key === "@context") {
    return {
      // TODO: Remove type assertion
      intermediateResult: new IR.NativeValue(value as JsonValue),
      patterns: [],
      projections: [],
      warnings: [],
    };
  }

  if (isId(ctx, key)) {
    if (!isString(value)) throw "TODO: Name must be a string";
    return {
      intermediateResult: new IR.Name(df.namedNode(value)),
      patterns: [],
      projections: [],
      warnings: [],
    };
  }

  const predicate = predicateForKey(key, ctx);

  if (!predicate) {
    // Key is not defined in the context.
    return {
      // TODO: Remove type assertion
      intermediateResult: new IR.NativeValue(value as JsonValue),
      patterns: [],
      projections: [],
      warnings: [
        {
          message: "Placeholder ignored at key not defined by context",
          path: [],
        },
      ],
    };
  }

  if (isPlaceholder(value)) {
    const variable = variableUnder(parent, key);

    return {
      intermediateResult: new IR.NativePlaceholder(variable),
      patterns: [af.createPattern(node, predicate, variable)],
      projections: [variable],
      warnings: [],
    };
  } else if (isLiteral(value)) {
    return {
      intermediateResult: new IR.NativeValue(value),
      patterns: [af.createPattern(node, predicate, toRdfLiteral(value))],
      projections: [],
      warnings: [],
    };
  } else if (isArray(value)) {
    const variable = variableUnder(parent, key);
    // TODO: Remove type assertion
    const parsedChild = await parsePlural(
      value as jsonld.NodeObject[],
      variable,
      ctx
    );
    return {
      intermediateResult: parsedChild.intermediateResult,
      patterns: [
        af.createPattern(node, predicate, variable),
        ...parsedChild.patterns,
      ],
      projections: parsedChild.projections,
      warnings: parsedChild.warnings,
    };
  } else if (isObject(value)) {
    const variable = variableUnder(parent, key);
    // TODO: Remove type assertion
    const parsedChild = await parseNodeObject(
      value as jsonld.NodeObject,
      variable,
      ctx
    );
    return {
      intermediateResult: parsedChild.intermediateResult,
      patterns: [
        af.createPattern(node, predicate, variable),
        ...parsedChild.patterns,
      ],
      projections: parsedChild.projections,
      warnings: [],
    };
  } else {
    throw "TODO: Not yet covered";
  }
};
