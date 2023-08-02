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
  type Evolver,
  append as append_,
  dissoc,
  evolve,
  pipe,
  mapParallelAsync,
  reduce,
  toPairs,
  anyPass as anyPass_,
  concat,
} from "rambdax";

import * as IR from "./IntermediateResult";
import { PLACEHOLDER, af, df } from "./common";
import { pipedAsync } from "./pipedAsync";
import { toRdfLiteral } from "./representation";
import { variableUnder } from "./variableUnder";

import type * as RDF from "@rdfjs/types";
import type { Algebra } from "sparqlalgebrajs";

// Patching: https://github.com/selfrefactor/rambda/pull/694
const append = append_ as <T>(x: T) => (list: T[]) => T[];

// https://github.com/selfrefactor/rambda/pull/695
const anyPass = anyPass_ as unknown as <T, U extends T[]>(predicates: {
  [K in keyof U]: (x: T) => x is U[K];
}) => (input: T) => input is U[number];

const isPlaceholder = (v: unknown) => v === PLACEHOLDER;

const addMapping =
  (k: string, v: IR.IntermediateResult) => (ir: IR.NodeObject) =>
    ir.addMapping(k, v);

const isLiteral = anyPass([isString, isNumber, isBoolean]);

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

const predicateForKey = (k: string, ctx: jsonld.ActiveContext) =>
  df.namedNode(Context.expandIri(ctx, k, { vocab: true }));

// TODO: Currently only producing NodeObjects
export const toSparql = async (query: jsonld.NodeObject) => {
  const { intermediateResult, patterns, projections } = await parseNodeObject(
    query,
    df.variable("root"),
    await nullContext()
  );

  return {
    intermediateResult,
    sparql: af.createProject(af.createBgp(patterns), projections),
  };
};

const parseNodeObject = async (
  query: jsonld.NodeObject,
  parent: RDF.Variable,
  outerCtx: Context.ActiveContext
): Promise<{
  intermediateResult: IR.NodeObject;
  patterns: Algebra.Pattern[];
  projections: RDF.Variable[];
}> => {
  const ctx = query["@context"]
    ? await jsonld.processContext(outerCtx, query["@context"])
    : outerCtx;

  // TODO:
  const id = query["@id"];
  if (!isUndefined(id) && !isString(id)) throw "TODO: Name must be a string";
  const node = id ? df.namedNode(id) : parent;

  // TODO:
  const isName = (k: string) => k === "@id";

  const init = {
    intermediateResult: new IR.NodeObject(Map(), query["@context"]),
    patterns: [] as Algebra.Pattern[],
    projections: [] as RDF.Variable[],
  };

  const operationForEntry = async ([k, v]: [k: string, v: unknown]) => {
    if (isName(k)) {
      if (!isString(v)) throw "TODO: Name must be a string";
      return evolve<Evolver<typeof init>>({
        intermediateResult: addMapping(k, new IR.Name(df.namedNode(v))),
      });
    } else if (isPlaceholder(v)) {
      const variable = variableUnder(parent, k);
      const predicate = predicateForKey(k, ctx);
      return evolve({
        intermediateResult: addMapping(k, new IR.NativePlaceholder(variable)),
        patterns: append(af.createPattern(node, predicate, variable)),
        projections: append(variable),
      });
    } else if (isLiteral(v)) {
      const literal = toRdfLiteral(v);
      const predicate = predicateForKey(k, ctx);
      return evolve({
        intermediateResult: addMapping(k, new IR.NativeValue(literal)),
        patterns: append(af.createPattern(node, predicate, literal)),
      });
    } else if (isObject(v)) {
      const variable = variableUnder(parent, k);
      const predicate = predicateForKey(k, ctx);
      const parsedChild = await parseNodeObject(v, variable, ctx);
      return evolve({
        intermediateResult: addMapping(k, parsedChild.intermediateResult),
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
