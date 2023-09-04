/* eslint-disable @typescript-eslint/no-throw-literal
   ---
   TODO: https://github.com/m-ld/xql/issues/15 */

import { Map } from "immutable";
import jsonld, { type ContextSpec, type ActiveContext } from "jsonld";
import Context from "jsonld/lib/context";
import { isUndefined, isString } from "lodash-es";
import { mapParallelAsync, reduce, toPairs, concat, filter } from "rambdax";

import {
  nestWarningsUnderKey,
  parsed,
  type Parser,
  type Parsed,
  type Parse,
  type ToParse,
} from "./common";
import * as IR from "../IntermediateResult";
import { af, df } from "../common";
import { evolve, keys, pipedAsync, partial } from "../upstream/rambda";
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
export const NodeObject: Parse<JsonObject, IR.NodeObject> = async function ({
  element,
  variable,
  ctx: outerCtx,
}) {
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
      await parseEntry(
        {
          /* eslint-disable-next-line
             @typescript-eslint/consistent-type-assertions
           ---
           Assume all the values are JsonValues. Technically, TS can't enforce
           this for us, because it doesn't do exact types. */
          element: [key, value as JsonValue],
          variable: childVariable,
          ctx,
          node,
        },
        this
      );

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

type ParsedEntry<IRType extends IR.IntermediateResult = IR.IntermediateResult> =
  Omit<Parsed<IRType>, "term">;

type ParseEntry<
  EntryValue extends JsonValue = JsonValue,
  IRType extends IR.IntermediateResult = IR.IntermediateResult
> = (
  toParse: ToParseEntry<EntryValue>,
  parser: Parser
) => Promise<ParsedEntry<IRType>>;

interface ToParseEntry<Query extends JsonValue = JsonValue>
  extends ToParse<Query> {
  /** The node which this entry belongs to. */
  node: RDF.Variable | RDF.NamedNode;
}

const parseEntry: ParseEntry<[key: string, value: JsonValue]> = async function (
  toParse,
  parser
) {
  const { element, variable, ctx, node } = toParse;
  const [key, value] = element;

  if (key === "@context") {
    return parseContextEntry({ ...toParse, element: value }, parser);
  }

  if (isId(ctx, key)) {
    return parseIdEntry({ ...toParse, element: value }, parser);
  }

  const predicate = predicateForKey(key, ctx);

  if (!predicate) {
    // Key is not defined in the context.
    return parseUnknownKeyEntry({ ...toParse, element: value }, parser);
  }

  return parseIriEntry(
    {
      element: value,
      variable,
      ctx,
      node,
      predicate,
    },
    parser
  );
};

const parseContextEntry: ParseEntry = ({ element }) =>
  Promise.resolve({
    intermediateResult: new IR.NativeValue(element),
    patterns: [],
    projections: [],
    warnings: [],
  });

const parseIdEntry: ParseEntry = ({ element }) => {
  if (!isString(element)) throw "TODO: Name must be a string";
  return Promise.resolve({
    intermediateResult: new IR.Name(df.namedNode(element)),
    patterns: [],
    projections: [],
    warnings: [],
  });
};

const parseUnknownKeyEntry: ParseEntry = ({ element }) =>
  Promise.resolve({
    intermediateResult: new IR.NativeValue(element),
    patterns: [],
    projections: [],
    warnings: [
      {
        message: "Key not defined by context and ignored",
        path: [],
      },
    ],
  });

const parseIriEntry = async (
  {
    element,
    variable,
    ctx,
    node,
    predicate,
  }: ToParseEntry & {
    /** The predicate between the node and what this query applies to */
    predicate: RDF.NamedNode;
  },
  parser: Parser
) => {
  const parsedChild = await parser.Resource({ element, variable, ctx });

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
