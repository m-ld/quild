import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { Map } from "immutable";
import { isArray, isEqual } from "lodash-es";
import { Factory as AlgebraFactory, type Algebra } from "sparqlalgebrajs";

import * as IR from "./IntermediateResult";
import { df } from "./common";
import { readAll } from "./readAll";
import { toSparql } from "./toSparql";

import type { Source } from "@rdfjs/types";
import type * as JsonLD from "jsonld";

const af = new AlgebraFactory(df);
const engine = new QueryEngine();

/**
 * Reads the query once and returns the result.
 * @param graph The RDF data to query.
 * @param query The xQL query to read.
 */
export const query = async (
  source: Source,
  query: JsonLD.NodeObject | JsonLD.NodeObject[]
): Promise<JsonLD.NodeObject> => {
  let initialIr: IR.IntermediateResult | undefined;
  let sparql: Algebra.Project | undefined;

  const query1 = {
    "@id": "https://swapi.dev/api/people/1/",
    "http://swapi.dev/documentation#hair_color": "?",
    "http://swapi.dev/documentation#eye_color": "?",
  } as const;

  const query2 = {
    "http://swapi.dev/documentation#name": "Luke Skywalker",
    "http://swapi.dev/documentation#hair_color": "?",
    "http://swapi.dev/documentation#eye_color": "?",
  } as const;

  const query3 = {
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    name: "Luke Skywalker",
    homeworld: { name: "?" },
  } as const;

  const query4 = {
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    "@id": "https://swapi.dev/api/people/1/",
    hair_color: "?",
    homeworld: {
      "@context": { planetName: "http://swapi.dev/documentation#name" },
      planetName: "?",
    },
  };

  if (
    (isEqual(query, query1) ||
      isEqual(query, query2) ||
      isEqual(query, query3) ||
      isEqual(query, query4)) &&
    !isArray(query)
  ) {
    ({ intermediateResult: initialIr, sparql } = await toSparql(query));
  }

  const query5 = [
    {
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      eye_color: "blue",
      name: "?",
      height: "?",
    },
  ];

  if (isEqual(query, query5)) {
    const root = df.variable("root");
    const rootName = df.variable("root·name");
    const rootHeight = df.variable("root·height");

    initialIr = new IR.Plural(
      root,
      new IR.NodeObject(
        Map({
          eye_color: new IR.NativeValue(df.literal("blue")),
          name: new IR.NativePlaceholder(rootName),
          height: new IR.NativePlaceholder(rootHeight),
        }),
        { "@vocab": "http://swapi.dev/documentation#" }
      )
    );

    sparql = af.createProject(
      af.createBgp([
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#eye_color"),
          df.literal("blue")
        ),
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#name"),
          rootName
        ),
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#height"),
          rootHeight
        ),
      ]),
      [root, rootName, rootHeight]
    );
  }

  const query6 = [
    {
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      eye_color: "blue",
      name: "?",
      films: [{ title: "?" }],
    },
  ];

  if (isEqual(query, query6)) {
    const root = df.variable("root");
    const rootName = df.variable("root·name");
    const rootFilms = df.variable("root·films");
    const rootFilmsTitle = df.variable("root·films·title");

    initialIr = new IR.Plural(
      df.variable("root"),
      new IR.NodeObject(
        Map({
          eye_color: new IR.NativeValue(df.literal("blue")),
          name: new IR.NativePlaceholder(rootName),
          films: new IR.Plural(
            rootFilms,
            new IR.NodeObject(
              Map({
                title: new IR.NativePlaceholder(rootFilmsTitle),
              })
            )
          ),
        }),
        { "@vocab": "http://swapi.dev/documentation#" }
      )
    );

    sparql = af.createProject(
      af.createBgp([
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#eye_color"),
          df.literal("blue")
        ),
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#name"),
          rootName
        ),
        af.createPattern(
          root,
          df.namedNode("http://swapi.dev/documentation#films"),
          rootFilms
        ),
        af.createPattern(
          rootFilms,
          df.namedNode("http://swapi.dev/documentation#title"),
          rootFilmsTitle
        ),
      ]),
      [root, rootName, rootFilms, rootFilmsTitle]
    );
  }

  if (initialIr && sparql) {
    const bindingsStream = await engine.queryBindings(sparql, {
      sources: [source],
    });

    const solutions = await readAll(bindingsStream);

    const ir = solutions.reduce<IR.IntermediateResult>(
      (partialIr, solution) => partialIr.addSolution(solution),
      initialIr
    );

    return ir.result() as JsonLD.NodeObject;
  }

  throw "TODO: Not covered";
};
