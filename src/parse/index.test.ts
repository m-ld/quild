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
            df.literal("Luke Skywalker")
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
          name: new IR.NativeValue(df.literal("Luke Skywalker")),
          homeworld: new IR.NodeObject(
            Map({
              name: new IR.NativePlaceholder(
                df.variable("root·homeworld·name")
              ),
            })
          ),
        }),
        { "@vocab": "http://swapi.dev/documentation#" }
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
            eye_color: new IR.NativeValue(df.literal("blue")),
            name: new IR.NativePlaceholder(df.variable("root·name")),
            height: new IR.NativePlaceholder(df.variable("root·height")),
          }),
          { "@vocab": "http://swapi.dev/documentation#" }
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

  // TODO: Deal with duplicate variable names
});
