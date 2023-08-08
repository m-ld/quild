import { describe, it, expect } from "@jest/globals";
import { Map } from "immutable";

import { parse } from ".";
import "../../test-util/toBeSparqlEqualTo";
import * as IR from "../IntermediateResult";
import { df } from "../common";

import type jsonld from "jsonld";

describe(parse, () => {
  it("can produce a query for a property by @id", async () => {
    const query = {
      "@id": "https://swapi.dev/api/people/1/",
      "http://swapi.dev/documentation#hair_color": "?",
      "http://swapi.dev/documentation#eye_color": "?",
    } as const;

    const { intermediateResult, sparql } = await parse(query);

    expect(intermediateResult).toStrictEqual(
      new IR.NodeObject(
        Map({
          "@id": new IR.Name(df.namedNode("https://swapi.dev/api/people/1/")),
          "http://swapi.dev/documentation#hair_color": new IR.NativePlaceholder(
            df.variable("root·hair_color")
          ),
          "http://swapi.dev/documentation#eye_color": new IR.NativePlaceholder(
            df.variable("root·eye_color")
          ),
        })
      )
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root·hair_color ?root·eye_color WHERE {
        <https://swapi.dev/api/people/1/>
          swapi:hair_color ?root·hair_color;
          swapi:eye_color ?root·eye_color.
      }
    `);
  });

  it("can produce a query for a property by other properties", async () => {
    const query = {
      "http://swapi.dev/documentation#name": "Luke Skywalker",
      "http://swapi.dev/documentation#hair_color": "?",
      "http://swapi.dev/documentation#eye_color": "?",
    } as jsonld.NodeObject;

    const { intermediateResult, sparql } = await parse(query);

    expect(intermediateResult).toStrictEqual(
      new IR.NodeObject(
        Map({
          "http://swapi.dev/documentation#name": new IR.NativeValue(
            "Luke Skywalker"
          ),
          "http://swapi.dev/documentation#hair_color": new IR.NativePlaceholder(
            df.variable("root·hair_color")
          ),
          "http://swapi.dev/documentation#eye_color": new IR.NativePlaceholder(
            df.variable("root·eye_color")
          ),
        })
      )
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root·hair_color ?root·eye_color WHERE {
        ?root
          swapi:name "Luke Skywalker";
          swapi:hair_color ?root·hair_color;
          swapi:eye_color ?root·eye_color.
      }
    `);
  });

  it("can produce a query for a singular related node", async () => {
    const query = {
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      name: "Luke Skywalker",
      homeworld: { name: "?" },
    } as const;

    const { intermediateResult, sparql } = await parse(query);

    expect(intermediateResult).toStrictEqual(
      new IR.NodeObject(
        Map({
          "@context": new IR.NativeValue({
            "@vocab": "http://swapi.dev/documentation#",
          }),
          name: new IR.NativeValue("Luke Skywalker"),
          homeworld: new IR.NodeObject(
            Map({
              name: new IR.NativePlaceholder(
                df.variable("root·homeworld·name")
              ),
            })
          ),
        })
      )
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root·homeworld·name WHERE {
        ?root·homeworld swapi:name ?root·homeworld·name.
        ?root swapi:name "Luke Skywalker";
              swapi:homeworld ?root·homeworld.
      }
    `);
  });

  it("can produce a query for multiple results", async () => {
    const query = [
      {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        eye_color: "blue",
        name: "?",
        height: "?",
      },
    ] as const;

    const { intermediateResult, sparql } = await parse(query);

    expect(intermediateResult).toStrictEqual(
      new IR.Plural(
        df.variable("root"),
        new IR.NodeObject(
          Map({
            "@context": new IR.NativeValue({
              "@vocab": "http://swapi.dev/documentation#",
            }),
            eye_color: new IR.NativeValue("blue"),
            name: new IR.NativePlaceholder(df.variable("root·name")),
            height: new IR.NativePlaceholder(df.variable("root·height")),
          })
        )
      )
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root ?root·name ?root·height WHERE {
        ?root swapi:eye_color "blue";
              swapi:name ?root·name;
              swapi:height ?root·height.
      }
    `);
  });

  it("can produce a query for a plural related node", async () => {
    const query = [
      {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        eye_color: "blue",
        name: "?",
        films: [{ title: "?" }],
      },
    ] as const;

    const { intermediateResult, sparql } = await parse(query);

    expect(intermediateResult).toStrictEqual(
      new IR.Plural(
        df.variable("root"),
        new IR.NodeObject(
          Map({
            "@context": new IR.NativeValue({
              "@vocab": "http://swapi.dev/documentation#",
            }),
            eye_color: new IR.NativeValue("blue"),
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
          })
        )
      )
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root ?root·films ?root·films·title ?root·name WHERE {
        ?root·films swapi:title ?root·films·title.
        ?root swapi:eye_color "blue";
              swapi:name ?root·name;
              swapi:films ?root·films.
      }
    `);
  });

  it("understands aliases for @id", async () => {
    const query = {
      "@context": { id: "@id" },
      id: "https://swapi.dev/api/people/1/",
      "http://swapi.dev/documentation#hair_color": "?",
      "http://swapi.dev/documentation#eye_color": "?",
    } as const;

    const { intermediateResult, sparql } = await parse(query);

    expect(intermediateResult).toStrictEqual(
      new IR.NodeObject(
        Map({
          "@context": new IR.NativeValue({ id: "@id" }),
          id: new IR.Name(df.namedNode("https://swapi.dev/api/people/1/")),
          "http://swapi.dev/documentation#hair_color": new IR.NativePlaceholder(
            df.variable("root·hair_color")
          ),
          "http://swapi.dev/documentation#eye_color": new IR.NativePlaceholder(
            df.variable("root·eye_color")
          ),
        })
      )
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root·hair_color ?root·eye_color WHERE {
        <https://swapi.dev/api/people/1/>
          swapi:hair_color ?root·hair_color;
          swapi:eye_color ?root·eye_color.
      }
    `);
  });

  it("ignores and warns about unmapped keys", async () => {
    const query = [
      {
        "@context": {
          name: "http://swapi.dev/documentation#name",
          films: "http://swapi.dev/documentation#films",
        },
        eye_color: "blue",
        name: "?",
        homeworld: { name: "?" },
        films: [{ title: "?" }],
        vehicles: [{ name: "?" }],
      },
    ] as const;

    const { intermediateResult, sparql, warnings } = await parse(query);

    expect(intermediateResult).toStrictEqual(
      new IR.Plural(
        df.variable("root"),
        new IR.NodeObject(
          Map({
            "@context": new IR.NativeValue({
              name: "http://swapi.dev/documentation#name",
              films: "http://swapi.dev/documentation#films",
            }),
            eye_color: new IR.NativeValue("blue"),
            name: new IR.NativePlaceholder(df.variable("root·name")),
            homeworld: new IR.NativeValue({ name: "?" }),
            films: new IR.Plural(
              df.variable("root·films"),
              new IR.NodeObject(Map({ title: new IR.NativeValue("?") }))
            ),
            vehicles: new IR.NativeValue([{ name: "?" }]),
          })
        )
      )
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root ?root·films ?root·name WHERE {
        ?root swapi:films ?root·films;
              swapi:name ?root·name.
      }
    `);

    expect(warnings).toStrictEqual([
      {
        message: "Placeholder ignored at key not defined by context",
        path: [0, "vehicles"],
      },
      {
        message: "Placeholder ignored at key not defined by context",
        path: [0, "films", 0, "title"],
      },
      {
        message: "Placeholder ignored at key not defined by context",
        path: [0, "homeworld"],
      },
      {
        message: "Placeholder ignored at key not defined by context",
        path: [0, "eye_color"],
      },
    ]);
  });

  // TODO: Deal with duplicate variable names
});
