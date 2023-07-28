/* eslint-disable @typescript-eslint/no-throw-literal */
import { Map } from "immutable";
import { isString } from "lodash-es";
import { append, dissoc, lensProp, over, pipe, reduce, toPairs } from "rambda";

import * as IR from "./IntermediateResult";
import { PLACEHOLDER, af, df } from "./common";
import { variableUnder } from "./variableUnder";

import type * as RDF from "@rdfjs/types";
import type { Algebra } from "sparqlalgebrajs";

const isPlaceholder = (v: unknown) => v === PLACEHOLDER;

const query1 = {
  "@id": "https://swapi.dev/api/people/1/",
  "http://swapi.dev/documentation#hair_color": "?",
  "http://swapi.dev/documentation#eye_color": "?",
} as const;

// TODO: Currently only producing NodeObjects
export const toSparql = (
  query: typeof query1,
  parent = df.variable("root")
) => {
  const id = query["@id"];
  const node = df.namedNode(id);

  // TODO:
  const isName = (k: string) => k === "@id";

  const init = {
    intermediateResult: new IR.NodeObject(
      Map() /* TODO: , query["@context"] */
    ),
    patterns: [] as Algebra.Pattern[],
    projections: [] as RDF.Variable[],
  };

  const thingToDo = (k: string, v: unknown) => {
    if (isName(k)) {
      if (!isString(v)) throw "TODO: Name must be a string";
      return pipe(
        over(lensProp("intermediateResult"), (ir: IR.NodeObject) =>
          ir.addMapping(k, new IR.Name(df.namedNode(v)))
        )
      );
    } else if (isPlaceholder(v)) {
      const variable = variableUnder(parent, k);
      // TODO:
      const predicate = df.namedNode(k);
      return pipe(
        over(lensProp("intermediateResult"), (ir: IR.NodeObject) =>
          ir.addMapping(k, new IR.NativePlaceholder(variable))
        ),
        over(
          lensProp("patterns"),
          append(af.createPattern(node, predicate, variable))
        ),
        over(lensProp("projections"), append(variable))
      );
    } else {
      throw "TODO: Not yet covered";
    }
  };

  const { intermediateResult, patterns, projections } = pipe(
    dissoc("@context"),
    toPairs,
    reduce((acc, [k, v]) => thingToDo(k, v)(acc), init)
  )(query);

  return {
    intermediateResult,
    sparql: af.createProject(af.createBgp(patterns), projections),
  };
};
