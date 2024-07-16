import { describe, it, expect } from "@jest/globals";

import { parseQuery } from ".";
import "../../test-util/toBeSparqlEqualTo";
import * as IR from "../IntermediateResult";
import { df } from "../common";

describe(parseQuery, () => {
  it("can produce a query for a property by @id", async () => {
    const query = {
      "@id": "https://swapi.dev/api/people/1/",
      "http://swapi.dev/documentation#hair_color": "?",
      "http://swapi.dev/documentation#eye_color": "?",
    } as const;

    const { intermediateResult, sparql } = await parseQuery(query);

    expect(intermediateResult).toStrictEqual(
      new IR.Object({
        "@id": new IR.LiteralValue("https://swapi.dev/api/people/1/"),
        "http://swapi.dev/documentation#hair_color": new IR.NativePlaceholder(
          df.variable("root·hair_color")
        ),
        "http://swapi.dev/documentation#eye_color": new IR.NativePlaceholder(
          df.variable("root·eye_color")
        ),
      })
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
    };

    const { intermediateResult, sparql } = await parseQuery(query);

    expect(intermediateResult).toStrictEqual(
      new IR.Object({
        "http://swapi.dev/documentation#name": new IR.LiteralValue(
          "Luke Skywalker"
        ),
        "http://swapi.dev/documentation#hair_color": new IR.NativePlaceholder(
          df.variable("root·hair_color")
        ),
        "http://swapi.dev/documentation#eye_color": new IR.NativePlaceholder(
          df.variable("root·eye_color")
        ),
      })
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

    const { intermediateResult, sparql } = await parseQuery(query);

    expect(intermediateResult).toStrictEqual(
      new IR.Object({
        "@context": new IR.LiteralValue({
          "@vocab": "http://swapi.dev/documentation#",
        }),
        name: new IR.LiteralValue("Luke Skywalker"),
        homeworld: new IR.Object({
          name: new IR.NativePlaceholder(df.variable("root·homeworld·name")),
        }),
      })
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

    const { intermediateResult, sparql } = await parseQuery(query);

    expect(intermediateResult).toStrictEqual(
      new IR.Set(
        df.variable("root"),
        new IR.Object({
          "@context": new IR.LiteralValue({
            "@vocab": "http://swapi.dev/documentation#",
          }),
          eye_color: new IR.LiteralValue("blue"),
          name: new IR.NativePlaceholder(df.variable("root·name")),
          height: new IR.NativePlaceholder(df.variable("root·height")),
        })
      )
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root ?root·name ?root·height WHERE {
        OPTIONAL {
          ?root swapi:eye_color "blue";
                swapi:name ?root·name;
                swapi:height ?root·height.
        }
      }
    `);
  });

  it("can produce a query for a plural related node", async () => {
    const query = {
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      eye_color: "blue",
      name: "?",
      films: [{ title: "?" }],
    } as const;

    const { intermediateResult, sparql } = await parseQuery(query);

    expect(intermediateResult).toStrictEqual(
      new IR.Object({
        "@context": new IR.LiteralValue({
          "@vocab": "http://swapi.dev/documentation#",
        }),
        eye_color: new IR.LiteralValue("blue"),
        name: new IR.NativePlaceholder(df.variable("root·name")),
        films: new IR.Set(
          df.variable("root·films"),
          new IR.Object({
            title: new IR.NativePlaceholder(df.variable("root·films·title")),
          })
        ),
      })
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root·films ?root·films·title ?root·name WHERE {
        ?root swapi:eye_color "blue";
              swapi:name ?root·name.

        OPTIONAL {
          ?root swapi:films ?root·films.
          ?root·films swapi:title ?root·films·title.
        } .
      }
    `);
  });

  it("can produce a query for a @set", async () => {
    const query = {
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      eye_color: "blue",
      name: "?",
      films: { "@set": [{ title: "?" }] },
    } as const;

    const { intermediateResult, sparql } = await parseQuery(query);

    expect(intermediateResult).toStrictEqual(
      new IR.Object({
        "@context": new IR.LiteralValue({
          "@vocab": "http://swapi.dev/documentation#",
        }),
        eye_color: new IR.LiteralValue("blue"),
        name: new IR.NativePlaceholder(df.variable("root·name")),
        films: new IR.Object({
          "@set": new IR.Set(
            df.variable("root·films"),
            new IR.Object({
              title: new IR.NativePlaceholder(df.variable("root·films·title")),
            })
          ),
        }),
      })
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root·films ?root·films·title ?root·name WHERE {
        ?root swapi:eye_color "blue";
              swapi:name ?root·name.

        OPTIONAL {
          ?root swapi:films ?root·films.
          ?root·films swapi:title ?root·films·title.
        } .
      }
    `);
  });

  it("can produce a query for a list", async () => {
    const query = {
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      "@id": "https://swapi.dev/api/vehicles/14/",
      pilots: {
        "@list": [{ name: "?" }],
      },
    } as const;

    const { intermediateResult, sparql } = await parseQuery(query);

    expect(intermediateResult).toStrictEqual(
      new IR.Object({
        "@context": new IR.LiteralValue({
          "@vocab": "http://swapi.dev/documentation#",
        }),
        "@id": new IR.LiteralValue("https://swapi.dev/api/vehicles/14/"),
        pilots: new IR.Object({
          "@list": new IR.LinkedList(
            df.variable("root·pilots"),
            df.variable("root·pilots·slot"),
            df.variable("root·pilots·slot·rest"),
            new IR.Object({
              name: new IR.NativePlaceholder(
                df.variable("root·pilots·slot·item·name")
              ),
            })
          ),
        }),
      })
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX swapi: <http://swapi.dev/documentation#>

      SELECT ?root·pilots ?root·pilots·slot ?root·pilots·slot·rest ?root·pilots·slot·item·name WHERE {
        <https://swapi.dev/api/vehicles/14/> swapi:pilots ?root·pilots.
        ?root·pilots rdf:rest* ?root·pilots·slot.
        ?root·pilots·slot rdf:first ?root·pilots·slot·item.
        ?root·pilots·slot rdf:rest ?root·pilots·slot·rest.

        OPTIONAL {
          ?root·pilots·slot·item swapi:name ?root·pilots·slot·item·name.
        } .
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

    const { intermediateResult, sparql } = await parseQuery(query);

    expect(intermediateResult).toStrictEqual(
      new IR.Object({
        "@context": new IR.LiteralValue({ id: "@id" }),
        id: new IR.LiteralValue("https://swapi.dev/api/people/1/"),
        "http://swapi.dev/documentation#hair_color": new IR.NativePlaceholder(
          df.variable("root·hair_color")
        ),
        "http://swapi.dev/documentation#eye_color": new IR.NativePlaceholder(
          df.variable("root·eye_color")
        ),
      })
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
    const query = {
      "@context": {
        name: "http://swapi.dev/documentation#name",
        films: "http://swapi.dev/documentation#films",
      },
      eye_color: "blue",
      name: "?",
      homeworld: { name: "?" },
      films: [{ title: "?" }],
      vehicles: [{ name: "?" }],
    } as const;

    const { intermediateResult, sparql, warnings } = await parseQuery(query);

    expect(intermediateResult).toStrictEqual(
      new IR.Object({
        "@context": new IR.LiteralValue({
          name: "http://swapi.dev/documentation#name",
          films: "http://swapi.dev/documentation#films",
        }),
        eye_color: new IR.LiteralValue("blue"),
        name: new IR.NativePlaceholder(df.variable("root·name")),
        homeworld: new IR.LiteralValue({ name: "?" }),
        films: new IR.Set(
          df.variable("root·films"),
          new IR.Object({ title: new IR.LiteralValue("?") })
        ),
        vehicles: new IR.LiteralValue([{ name: "?" }]),
      })
    );

    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root·films ?root·name WHERE {
        ?root swapi:name ?root·name.
        OPTIONAL { ?root swapi:films ?root·films. }
      }
    `);

    expect(warnings).toStrictEqual([
      {
        message: "Key not defined by context and ignored",
        path: ["vehicles"],
      },
      {
        message: "Key not defined by context and ignored",
        path: ["films", 0, "title"],
      },
      {
        message: "Key not defined by context and ignored",
        path: ["homeworld"],
      },
      {
        message: "Key not defined by context and ignored",
        path: ["eye_color"],
      },
    ]);
  });

  // TODO: Deal with duplicate variable names
});
