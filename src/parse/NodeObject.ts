/* eslint-disable @typescript-eslint/no-throw-literal
   ---
   TODO: https://github.com/m-ld/quild/issues/15 */

import { isUndefined, isString } from "lodash-es";
import {
  mapParallelAsync,
  reduce,
  toPairs,
  concat,
  filter,
  equals,
  mapToObject,
} from "rambdax";

import {
  nestWarningsUnderKey,
  parsed,
  type Parser,
  type Parsed,
  type ToParse,
  parseWarning,
  type ProjectableOperation,
} from "./common";
import { propagateContext } from "./common";
import * as IR from "../IntermediateResult";
import { PLACEHOLDER, af, df } from "../common";
import { evolve, keys, pipedAsync, partial } from "../upstream/rambda";
import { variableUnder } from "../variableUnder";

import type * as RDF from "@rdfjs/types";
import type {
  Containers,
  JsonLdContextNormalized,
} from "jsonld-context-parser";
import type { JsonValue } from "type-fest";

const isAbsoluteIri = (x: string): boolean => x.includes(":");

/**
 * Returns a `NamedNode` predicate for the given key, expanded under the given
 * context, or `null` if the key does not expand to an absolute IRI.
 * @param key The key to expand.
 * @param ctx The context under which to expand the key.
 */
const predicateForKey = (ctx: JsonLdContextNormalized, key: string) => {
  const expanded = ctx.expandTerm(key, true);
  return expanded && isAbsoluteIri(expanded) ? df.namedNode(expanded) : null;
};

const addMapping =
  (k: string, v: IR.IntermediateResult) => (ir: IR.NodeObject) =>
    ir.addMapping(k, v);

const isId = (ctx: JsonLdContextNormalized, k: string) =>
  ctx.expandTerm(k, true) === "@id";

/**
 * Returns true iff the `@container` of `term` in `ctx` is exactly `container`.
 */
const termIsContainer = (
  ctx: JsonLdContextNormalized,
  term: string,
  container: Containers
) => {
  const rawCtx: Record<string, unknown> = ctx.getContextRaw();
  const termDef = rawCtx[term];
  if (termDef && typeof termDef === "object" && "@container" in termDef) {
    const actualContainer = termDef["@container"];
    return equals(
      mapToObject(
        (c) => ({ [c]: true }),
        Array.isArray(container) ? container : [container]
      ),
      actualContainer
    );
  } else {
    return false;
  }
};

/**
 * Parse a JSON-LD Node Object.
 *
 * @see https://www.w3.org/TR/json-ld11/#node-objects
 */
export const NodeObject: Parser["NodeObject"] = async function ({
  element,
  variable,
  ctx: outerCtx,
}) {
  const ctx = await propagateContext(element["@context"], outerCtx);

  const [idKey, ...extraIdKeys] = filter(partial(isId, ctx), keys(element));

  if (extraIdKeys.length)
    throw "TODO: Invalid JSON-LD syntax; colliding keywords detected.";
  const id = idKey && element[idKey];
  if (!isUndefined(id) && !isString(id)) throw "TODO: Name must be a string";

  const projectNodeName = id === PLACEHOLDER;
  const node = id && !projectNodeName ? df.namedNode(id) : variable;

  const operationForEntry = async ([key, value]: [
    key: string,
    value: unknown
  ]): Promise<(p: Parsed<IR.NodeObject>) => Parsed<IR.NodeObject>> => {
    const childVariable = variableUnder(variable, key);

    const { intermediateResult, operation, projections, warnings } =
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

    const isOptional = Array.isArray(value);

    return evolve({
      intermediateResult: addMapping(key, intermediateResult),
      operation: (previousOp: ProjectableOperation): ProjectableOperation =>
        isOptional
          ? af.createLeftJoin(previousOp, operation)
          : af.createJoin([previousOp, operation]),
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
        intermediateResult: new IR.NodeObject({}),
        term: variable,
        projections: projectNodeName ? [variable] : [],
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

  const predicate = predicateForKey(ctx, key);

  if (!predicate) {
    // Key is not defined in the context.
    return parseUnknownKeyEntry({ ...toParse, element: value }, parser);
  }

  const resourceElement = termIsContainer(ctx, key, "@graph")
    ? { "@graph": value }
    : termIsContainer(ctx, key, "@list")
    ? { "@list": value }
    : termIsContainer(ctx, key, "@set")
    ? { "@set": value }
    : value;

  return parseIriEntry(
    {
      element: resourceElement,
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
    operation: af.createJoin([]),
    projections: [],
    warnings: [],
  });

const parseIdEntry: ParseEntry = ({ element, node }) => {
  if (!isString(element)) throw "TODO: Name must be a string";
  if (node.termType === "Variable") {
    return Promise.resolve({
      intermediateResult: new IR.NamePlaceholder(node),
      operation: af.createJoin([]),
      projections: [],
      warnings: [],
    });
  } else {
    return Promise.resolve({
      intermediateResult: new IR.NativeValue(element),
      operation: af.createJoin([]),
      projections: [],
      warnings: [],
    });
  }
};

const parseUnknownKeyEntry: ParseEntry = ({ element }) =>
  Promise.resolve({
    intermediateResult: new IR.NativeValue(element),
    operation: af.createJoin([]),
    projections: [],
    warnings: [
      parseWarning({
        message: "Key not defined by context and ignored",
      }),
    ],
  });

/**
 * Parse a Node Object entry whose key expands to an IRI.
 *
 * @see https://www.w3.org/TR/json-ld11/#node-objects
 *
 * > The values associated with keys that expand to
 * > an [IRI](https://tools.ietf.org/html/rfc3987#section-2) *MUST* be one of
 * > the following:
 * >
 * > - [string](https://infra.spec.whatwg.org/#javascript-string),
 * > - [number](https://tc39.es/ecma262/#sec-terms-and-definitions-number-value),
 * > - `true`,
 * > - `false`,
 * > - [null](https://infra.spec.whatwg.org/#nulls),
 * > - [node object](https://www.w3.org/TR/json-ld11/#dfn-node-object),
 * > - [graph object](https://www.w3.org/TR/json-ld11/#dfn-graph-object),
 * > - [value object](https://www.w3.org/TR/json-ld11/#dfn-value-object),
 * > - [list object](https://www.w3.org/TR/json-ld11/#dfn-list-object),
 * > - [set object](https://www.w3.org/TR/json-ld11/#dfn-set-object),
 * > - an [array](https://infra.spec.whatwg.org/#list) of zero or more of any of the possibilities above,
 * > - a [language map](https://www.w3.org/TR/json-ld11/#dfn-language-map),
 * > - an [index map](https://www.w3.org/TR/json-ld11/#dfn-index-map),
 * > - an [included block](https://www.w3.org/TR/json-ld11/#dfn-included-block)
 * > - an [id map](https://www.w3.org/TR/json-ld11/#dfn-id-map), or
 * > - a [type map](https://www.w3.org/TR/json-ld11/#dfn-type-map) */
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
): Promise<ParsedEntry> => {
  const parsedChild = await parser.Resource({ element, variable, ctx });

  return {
    intermediateResult: parsedChild.intermediateResult,
    operation: af.createJoin([
      af.createBgp([af.createPattern(node, predicate, parsedChild.term)]),
      parsedChild.operation,
    ]),
    projections: parsedChild.projections,
    warnings: parsedChild.warnings,
  };
};
