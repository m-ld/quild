/* eslint-disable @typescript-eslint/no-throw-literal */
import { Map } from "immutable";
import { isBoolean, isNull, isNumber, isString, isUndefined } from "lodash-es";
import {
  type Evolver,
  append as append_,
  dissoc,
  evolve,
  pipe,
  reduce,
  toPairs,
  map,
  anyPass as anyPass_,
} from "rambda";

import * as IR from "./IntermediateResult";
import { PLACEHOLDER, af, df } from "./common";
import { toRdfLiteral } from "./representation";
import { variableUnder } from "./variableUnder";

import type * as RDF from "@rdfjs/types";
import type { Algebra } from "sparqlalgebrajs";
import type { JsonObject } from "type-fest";

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

// TODO: Currently only producing NodeObjects
export const toSparql = (query: JsonObject, parent = df.variable("root")) => {
  // TODO:
  const id = query["@id"];
  if (!isUndefined(id) && !isString(id)) throw "TODO: Name must be a string";
  const node = id ? df.namedNode(id) : parent;

  // TODO:
  const isName = (k: string) => k === "@id";

  const init = {
    intermediateResult: new IR.NodeObject(
      Map() /* TODO: , query["@context"] */
    ),
    patterns: [] as Algebra.Pattern[],
    projections: [] as RDF.Variable[],
  };

  const thingToDo = ([k, v]: [k: string, v: unknown]) => {
    if (isName(k)) {
      if (!isString(v)) throw "TODO: Name must be a string";
      return evolve<Evolver<typeof init>>({
        intermediateResult: addMapping(k, new IR.Name(df.namedNode(v))),
      });
    } else if (isPlaceholder(v)) {
      const variable = variableUnder(parent, k);
      // TODO:
      const predicate = df.namedNode(k);
      return evolve({
        intermediateResult: addMapping(k, new IR.NativePlaceholder(variable)),
        patterns: append(af.createPattern(node, predicate, variable)),
        projections: append(variable),
      });
    } else if (isLiteral(v)) {
      const literal = toRdfLiteral(v);
      // TODO:
      const predicate = df.namedNode(k);
      return evolve({
        intermediateResult: addMapping(k, new IR.NativeValue(literal)),
        patterns: append(af.createPattern(node, predicate, literal)),
      });
    } else {
      throw "TODO: Not yet covered";
    }
  };

  const { intermediateResult, patterns, projections } = pipe(
    dissoc("@context"),
    toPairs,
    map(thingToDo),
    reduce((acc, f) => f(acc), init)
  )(query);

  return {
    intermediateResult,
    sparql: af.createProject(af.createBgp(patterns), projections),
  };
};
