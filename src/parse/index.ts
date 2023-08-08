/* eslint-disable @typescript-eslint/no-throw-literal */
import { Map } from "immutable";
import jsonld from "jsonld";
import Context from "jsonld/lib/context";
import {
  isBoolean,
  isNumber,
  isObject,
  isString,
  isUndefined,
} from "lodash-es";
import {
  mapParallelAsync,
  reduce,
  toPairs,
  anyPass as anyPass_,
  concat,
  map,
  filter,
  piped,
} from "rambdax";

import * as IR from "../IntermediateResult";
import { PLACEHOLDER, af, df } from "../common";
import { pipedAsync } from "../pipedAsync";
import { toRdfLiteral } from "../representation";
import { evolve } from "../upstream/rambda/evolve";
import { keys } from "../upstream/rambda/keys";
import { prepend } from "../upstream/rambda/prepend";
import { variableUnder } from "../variableUnder";

import type * as RDF from "@rdfjs/types";
import type { Algebra } from "sparqlalgebrajs";
import type { JsonValue } from "type-fest";

// https://github.com/selfrefactor/rambda/pull/695
const anyPass = anyPass_ as unknown as <T, U extends T[]>(predicates: {
  [K in keyof U]: (x: T) => x is U[K];
}) => (input: T) => input is U[number];

const isPlaceholder = (v: unknown): v is typeof PLACEHOLDER =>
  v === PLACEHOLDER;

const addMapping =
  (k: string, v: IR.IntermediateResult) => (ir: IR.NodeObject) =>
    ir.addMapping(k, v);

const isLiteral = anyPass([isString, isNumber, isBoolean]);

/**
 * Array.isArray, but typed to properly narrow types which may be readonly
 * arrays.
 *
 * @see https://github.com/microsoft/TypeScript/issues/17002
 */
const isArray = Array.isArray as (arg: unknown) => arg is readonly unknown[];

/**
 * Returns a null (empty, initial) `ActiveContext`.
 */
const nullContext = (
  options?: jsonld.ProcessingOptions
): Promise<jsonld.ActiveContext> =>
  // Relies on `jsonld.processContext()` short-circuiting when the local context
  // is `null`. Otherwise, there's no way to get an initial context using the
  // public API.
  jsonld.processContext(null as unknown as jsonld.ActiveContext, null, options);

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

export const parse = async (
  query: jsonld.NodeObject | readonly jsonld.NodeObject[]
) => {
  const { intermediateResult, patterns, projections, warnings } =
    await (isArray(query)
      ? parsePlural(query, df.variable("root"), await nullContext())
      : parseNodeObject(query, df.variable("root"), await nullContext()));

  return {
    intermediateResult,
    sparql: af.createProject(af.createBgp(patterns), projections),
    warnings,
  };
};

interface ParseWarning {
  message: string;
  path: Array<string | number>;
}

interface Parsed<IRType extends IR.IntermediateResult> {
  intermediateResult: IRType;
  patterns: Algebra.Pattern[];
  projections: RDF.Variable[];
  warnings: ParseWarning[];
}

const nestWarningsUnderKey = (
  key: ParseWarning["path"][number]
): ((
  iterable: ParseWarning[]
) => Array<{ message: string; path: Array<typeof key> }>) =>
  map(
    evolve({
      path: prepend(key)<typeof key>,
    })
  );

const parsePlural = async (
  query: readonly jsonld.NodeObject[],
  parent: RDF.Variable,
  outerCtx: Context.ActiveContext
): Promise<Parsed<IR.Plural>> => {
  const soleSubquery = query[0];
  if (!(soleSubquery && query.length === 1)) {
    throw "TODO: Only exactly one subquery is supported in an array, so far.";
  }

  return evolve(
    {
      intermediateResult: (ir) => new IR.Plural(parent, ir),
      projections: prepend(parent)<RDF.Variable>,
      warnings: nestWarningsUnderKey(0),
    },
    await parseNodeObject(soleSubquery, parent, outerCtx)
  );
};

const parseNodeObject = async (
  query: jsonld.NodeObject,
  parent: RDF.Variable,
  outerCtx: Context.ActiveContext
): Promise<Parsed<IR.NodeObject>> => {
  const ctx = query["@context"]
    ? await jsonld.processContext(outerCtx, query["@context"])
    : outerCtx;

  const isId = (k: string) =>
    Context.expandIri(ctx, k, { vocab: true }) === "@id";

  const [idKey, ...extraIdKeys] = piped(keys(query), filter(isId));
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
      await parseEntry([key, value]);

    return evolve({
      intermediateResult: addMapping(key, intermediateResult),
      patterns: concat(patterns),
      projections: concat(projections),
      warnings: concat(nestWarningsUnderKey(key)(warnings)),
    });
  };

  const parseEntry = async ([key, value]: [
    key: string,
    value: unknown
  ]): Promise<Parsed<IR.IntermediateResult>> => {
    if (key === "@context") {
      return {
        // TODO: Remove type assertion
        intermediateResult: new IR.NativeValue(value as JsonValue),
        patterns: [],
        projections: [],
        warnings: [],
      };
    }

    if (isId(key)) {
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

  return pipedAsync(
    query,
    toPairs,
    mapParallelAsync(operationForEntry),
    reduce((acc, f) => f(acc), init)
  );
};
