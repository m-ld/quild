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
  append as append_,
  dissoc,
  pipe,
  mapParallelAsync,
  reduce,
  toPairs,
  anyPass as anyPass_,
  concat,
  map,
} from "rambdax";

import * as IR from "../IntermediateResult";
import { PLACEHOLDER, af, df } from "../common";
import { pipedAsync } from "../pipedAsync";
import { toRdfLiteral } from "../representation";
import { type Evolver, evolve } from "../upstream/rambda/evolve";
import { prepend } from "../upstream/rambda/prepend";
import { variableUnder } from "../variableUnder";

import type * as RDF from "@rdfjs/types";
import type { Algebra } from "sparqlalgebrajs";

// Patching: https://github.com/selfrefactor/rambda/pull/694
const append = append_ as <T>(x: T) => (list: T[]) => T[];

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

  // TODO:
  const id = query["@id"];
  if (!isUndefined(id) && !isString(id)) throw "TODO: Name must be a string";
  const node = id ? df.namedNode(id) : parent;

  // TODO:
  const isName = (k: string) => k === "@id";

  const init: Parsed<IR.NodeObject> = {
    intermediateResult: new IR.NodeObject(Map(), query["@context"]),
    patterns: [],
    projections: [],
    warnings: [],
  };

  const operationForEntry = async ([key, value]: [
    key: string,
    value: unknown
  ]) => {
    if (isName(key)) {
      if (!isString(value)) throw "TODO: Name must be a string";
      return evolve({
        intermediateResult: addMapping(key, new IR.Name(df.namedNode(value))),
      });
    }

    const predicate = predicateForKey(key, ctx);

    if (!predicate) {
      // Key is not defined in the context.
      return evolve({
        intermediateResult: addMapping(key, new IR.NativeValue(value)),
        warnings: append<ParseWarning>({
          message: "Placeholder ignored at key not defined by context",
          path: [key],
        }),
      });
    }

    if (isPlaceholder(value)) {
      const variable = variableUnder(parent, key);

      return evolve({
        intermediateResult: addMapping(key, new IR.NativePlaceholder(variable)),
        patterns: append(af.createPattern(node, predicate, variable)),
        projections: append(variable),
      });
    } else if (isLiteral(value)) {
      return evolve({
        intermediateResult: addMapping(key, new IR.NativeValue(value)),
        patterns: append(
          af.createPattern(node, predicate, toRdfLiteral(value))
        ),
      });
    } else if (isArray(value)) {
      const variable = variableUnder(parent, key);
      const parsedChild = await parsePlural(value, variable, ctx);
      return evolve<Evolver<Parsed<IR.NodeObject>>>({
        intermediateResult: addMapping(key, parsedChild.intermediateResult),
        patterns: pipe(
          append(af.createPattern(node, predicate, variable)),
          concat(parsedChild.patterns)
        ),
        projections: concat(parsedChild.projections),
        warnings: concat(nestWarningsUnderKey(key)(parsedChild.warnings)),
      });
    } else if (isObject(value)) {
      const variable = variableUnder(parent, key);
      const parsedChild = await parseNodeObject(value, variable, ctx);
      return evolve({
        intermediateResult: addMapping(key, parsedChild.intermediateResult),
        patterns: pipe(
          append(af.createPattern(node, predicate, variable)),
          concat(parsedChild.patterns)
        ),
        projections: concat(parsedChild.projections),
      });
    } else {
      throw "TODO: Not yet covered";
    }
  };

  return pipedAsync(
    query,
    dissoc("@context"),
    toPairs,
    mapParallelAsync(operationForEntry),
    reduce((acc, f) => f(acc), init)
  );
};
