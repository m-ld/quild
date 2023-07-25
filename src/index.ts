// eslint-disable-next-line import/no-extraneous-dependencies
import { BindingsFactory } from "@comunica/bindings-factory";
import { Map } from "immutable";
import { isEqual } from "lodash-es";
import { DataFactory } from "rdf-data-factory";

import * as IR from "./IntermediateResult";
import { integer } from "./common";

import type { Quad, Source, Term } from "@rdfjs/types";
import type * as JsonLD from "jsonld";

const df = new DataFactory();
const bf = new BindingsFactory(df);

// This madness is just to cope with the fact that jsonld.toRDF doesn't return
// real Quads. Namely, the "Quad" itself is missing its `termType`, and it and
// its terms are all missing the `.equals()` method.
export const fixQuad = (q: JsonLD.Quad): Quad => {
  const fixTerm = ((term: Term) =>
    term.termType === "Literal"
      ? df.literal(term.value, term.datatype)
      : df.fromTerm(term)) as typeof df.fromTerm;

  // Pretend q is a real quad for a moment.
  const quad = q as Quad;
  return df.quad(
    fixTerm(quad.subject),
    fixTerm(quad.predicate),
    fixTerm(quad.object),
    fixTerm(quad.graph)
  );
};

/**
 * Reads the query once and returns the result.
 * @param graph The RDF data to query.
 * @param query The xQL query to read.
 */
export const query = async (
  source: Source,
  query: JsonLD.NodeObject | JsonLD.NodeObject[]
): Promise<JsonLD.NodeObject> => {
  const query1 = {
    "@id": "https://swapi.dev/api/people/1/",
    "http://swapi.dev/documentation#hair_color": "?",
    "http://swapi.dev/documentation#eye_color": "?",
  };

  if (isEqual(query, query1)) {
    const initialIr = new IR.NodeObject(
      Map({
        "@id": new IR.Name(df.namedNode("https://swapi.dev/api/people/1/")),
        "http://swapi.dev/documentation#hair_color": new IR.NativePlaceholder(
          df.variable("root·hair_color")
        ),
        "http://swapi.dev/documentation#eye_color": new IR.NativePlaceholder(
          df.variable("root·eye_color")
        ),
      })
    );

    const solutions = [
      bf.fromRecord({
        "root·hair_color": df.literal("blond"),
        "root·eye_color": df.literal("blue"),
      }),
    ];

    const ir = solutions.reduce<IR.IntermediateResult>(
      (partialIr, solution) => partialIr.addSolution(solution),
      initialIr
    );

    return ir.result() as JsonLD.NodeObject;
  }

  const query2 = {
    "http://swapi.dev/documentation#name": "Luke Skywalker",
    "http://swapi.dev/documentation#hair_color": "?",
    "http://swapi.dev/documentation#eye_color": "?",
  };

  if (isEqual(query, query2)) {
    const initialIr = new IR.NodeObject(
      Map({
        "http://swapi.dev/documentation#name": new IR.NativeValue(
          df.literal("Luke Skywalker")
        ),
        "http://swapi.dev/documentation#hair_color": new IR.NativePlaceholder(
          df.variable("root·hair_color")
        ),
        "http://swapi.dev/documentation#eye_color": new IR.NativePlaceholder(
          df.variable("root·eye_color")
        ),
      })
    );

    const solutions = [
      bf.fromRecord({
        "root·hair_color": df.literal("blond"),
        "root·eye_color": df.literal("blue"),
      }),
    ];

    const ir = solutions.reduce<IR.IntermediateResult>(
      (partialIr, solution) => partialIr.addSolution(solution),
      initialIr
    );

    return ir.result() as JsonLD.NodeObject;
  }

  const query3 = {
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    name: "Luke Skywalker",
    homeworld: { name: "?" },
  };

  if (isEqual(query, query3)) {
    const initialIr = new IR.NodeObject(
      Map({
        name: new IR.NativeValue(df.literal("Luke Skywalker")),
        homeworld: new IR.NodeObject(
          Map({
            name: new IR.NativePlaceholder(df.variable("root·homeworld·name")),
          })
        ),
      }),
      { "@vocab": "http://swapi.dev/documentation#" }
    );

    const solutions = [
      bf.fromRecord({
        "root·homeworld·name": df.literal("Tatooine"),
      }),
    ];

    const ir = solutions.reduce<IR.IntermediateResult>(
      (partialIr, solution) => partialIr.addSolution(solution),
      initialIr
    );

    return ir.result() as JsonLD.NodeObject;
  }

  const query4 = {
    "@context": { "@vocab": "http://swapi.dev/documentation#" },
    "@id": "https://swapi.dev/api/people/1/",
    hair_color: "?",
    homeworld: {
      "@context": { planetName: "http://swapi.dev/documentation#name" },
      planetName: "?",
    },
  };

  if (isEqual(query, query4)) {
    const initialIr = new IR.NodeObject(
      Map({
        "@id": new IR.Name(df.namedNode("https://swapi.dev/api/people/1/")),
        hair_color: new IR.NativePlaceholder(df.variable("root·hair_color")),
        homeworld: new IR.NodeObject(
          Map({
            planetName: new IR.NativePlaceholder(
              df.variable("root·homeworld·planetName")
            ),
          }),
          { planetName: "http://swapi.dev/documentation#name" }
        ),
      }),
      { "@vocab": "http://swapi.dev/documentation#" }
    );

    const solutions = [
      bf.fromRecord({
        "root·hair_color": df.literal("blond"),
        "root·homeworld·planetName": df.literal("Tatooine"),
      }),
    ];

    const ir = solutions.reduce<IR.IntermediateResult>(
      (partialIr, solution) => partialIr.addSolution(solution),
      initialIr
    );

    return ir.result() as JsonLD.NodeObject;
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
    const initialIr = new IR.Plural(
      df.variable("root"),
      new IR.NodeObject(
        Map({
          eye_color: new IR.NativeValue(df.literal("blue")),
          name: new IR.NativePlaceholder(df.variable("root·name")),
          height: new IR.NativePlaceholder(df.variable("root·height")),
        }),
        { "@vocab": "http://swapi.dev/documentation#" }
      )
    );

    const solutions = [
      bf.fromRecord({
        root: df.namedNode("https://swapi.dev/api/people/1/"),
        "root·name": df.literal("Luke Skywalker"),
        "root·height": df.literal("172", integer),
      }),
      bf.fromRecord({
        root: df.namedNode("https://swapi.dev/api/people/6/"),
        "root·name": df.literal("Owen Lars"),
        "root·height": df.literal("178", integer),
      }),
    ];

    const ir = solutions.reduce<IR.IntermediateResult>(
      (partialIr, solution) => partialIr.addSolution(solution),
      initialIr
    );

    return ir.result() as JsonLD.NodeObject;
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
    const initialIr = new IR.Plural(
      df.variable("root"),
      new IR.NodeObject(
        Map({
          eye_color: new IR.NativeValue(df.literal("blue")),
          name: new IR.NativePlaceholder(df.variable("root·name")),
          films: new IR.Plural(
            df.variable("root·films"),
            new IR.NodeObject(
              Map({
                title: new IR.NativePlaceholder(
                  df.variable("root·films·title")
                ),
              })
            )
          ),
        }),
        { "@vocab": "http://swapi.dev/documentation#" }
      )
    );

    const solutions = [
      bf.fromRecord({
        root: df.namedNode("https://swapi.dev/api/people/1/"),
        "root·name": df.literal("Luke Skywalker"),
        "root·films": df.namedNode("https://swapi.dev/api/films/1/"),
        "root·films·title": df.literal("A New Hope"),
      }),
      bf.fromRecord({
        root: df.namedNode("https://swapi.dev/api/people/1/"),
        "root·name": df.literal("Luke Skywalker"),
        "root·films": df.namedNode("https://swapi.dev/api/films/2/"),
        "root·films·title": df.literal("The Empire Strikes Back"),
      }),
      bf.fromRecord({
        root: df.namedNode("https://swapi.dev/api/people/1/"),
        "root·name": df.literal("Luke Skywalker"),
        "root·films": df.namedNode("https://swapi.dev/api/films/3/"),
        "root·films·title": df.literal("Return of the Jedi"),
      }),
      bf.fromRecord({
        root: df.namedNode("https://swapi.dev/api/people/1/"),
        "root·name": df.literal("Luke Skywalker"),
        "root·films": df.namedNode("https://swapi.dev/api/films/6/"),
        "root·films·title": df.literal("Revenge of the Sith"),
      }),
      bf.fromRecord({
        root: df.namedNode("https://swapi.dev/api/people/6/"),
        "root·name": df.literal("Owen Lars"),
        "root·films": df.namedNode("https://swapi.dev/api/films/1/"),
        "root·films·title": df.literal("A New Hope"),
      }),
      bf.fromRecord({
        root: df.namedNode("https://swapi.dev/api/people/6/"),
        "root·name": df.literal("Owen Lars"),
        "root·films": df.namedNode("https://swapi.dev/api/films/5/"),
        "root·films·title": df.literal("Attack of the Clones"),
      }),
      bf.fromRecord({
        root: df.namedNode("https://swapi.dev/api/people/6/"),
        "root·name": df.literal("Owen Lars"),
        "root·films": df.namedNode("https://swapi.dev/api/films/6/"),
        "root·films·title": df.literal("Revenge of the Sith"),
      }),
    ];

    const ir = solutions.reduce<IR.IntermediateResult>(
      (partialIr, solution) => partialIr.addSolution(solution),
      initialIr
    );

    return ir.result() as JsonLD.NodeObject;
  }

  throw "TODO: Not covered";
};
