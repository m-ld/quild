import { describe, it, expect } from "@jest/globals";
import { Map } from "immutable";

import * as IR from "./IntermediateResult";
import { df } from "./common";
import { toSparql } from "./toSparql";
import "../test-util/toBeSparqlEqualTo";

describe(toSparql, () => {
  it("can produce a query for a property by @id", () => {
    const query = {
      "@id": "https://swapi.dev/api/people/1/",
      "http://swapi.dev/documentation#hair_color": "?",
      "http://swapi.dev/documentation#eye_color": "?",
    } as const;

    const expectedIR = new IR.NodeObject(
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

    const { intermediateResult, sparql } = toSparql(query);

    expect(intermediateResult).toStrictEqual(expectedIR);
    expect(sparql).toBeSparqlEqualTo(/* sparql */ `
      PREFIX swapi: <http://swapi.dev/documentation#>
      SELECT ?root·hair_color ?root·eye_color WHERE {
        <https://swapi.dev/api/people/1/>
          swapi:hair_color ?root·hair_color;
          swapi:eye_color ?root·eye_color.
      }
    `);
  });

  it("can produce a query for a property by other properties", () => {
    const query = {
      "http://swapi.dev/documentation#name": "Luke Skywalker",
      "http://swapi.dev/documentation#hair_color": "?",
      "http://swapi.dev/documentation#eye_color": "?",
    } as const;

    const expectedIR = new IR.NodeObject(
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

    const { intermediateResult, sparql } = toSparql(query);

    expect(intermediateResult).toStrictEqual(expectedIR);
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

  // TODO: Deal with duplicate variable names
});
