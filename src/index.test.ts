import { describe, it, expect } from "@jest/globals";
import jsonld from "jsonld";

import data from "../fixtures/data.json";

import { dataset } from "./fixedDataset.testutil";

import { fixQuad, query } from "./index";

const quads = (await jsonld.toRDF(data as jsonld.JsonLdDocument)).map(fixQuad);
const source = dataset().addAll(quads);

describe("query()", () => {
  it("can query for a property by @id", async () => {
    expect(
      await query(source, {
        "@id": "https://swapi.dev/api/people/1/",
        "http://swapi.dev/documentation#hair_color": "?",
      })
    ).toStrictEqual({
      "@id": "https://swapi.dev/api/people/1/",
      "http://swapi.dev/documentation#hair_color": "blond",
    });
  });

  // Note that the result includes an `@id`!
  it("can query for a property by other properties", async () => {
    expect(
      await query(source, {
        "http://swapi.dev/documentation#name": "Luke Skywalker",
        "http://swapi.dev/documentation#eye_color": "?",
      })
    ).toStrictEqual({
      "@id": "https://swapi.dev/api/people/1/",
      "http://swapi.dev/documentation#name": "Luke Skywalker",
      "http://swapi.dev/documentation#eye_color": "blue",
    });
  });

  it("can access a singular related node", async () => {
    expect(
      await query(source, {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        name: "Luke Skywalker",
        homeworld: { name: "?" },
      })
    ).toStrictEqual({
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      "@id": "https://swapi.dev/api/people/1/",
      name: "Luke Skywalker",
      homeworld: { name: "Tattooine" },
    });
  });

  it("preserves the contexts used in the query", async () => {
    expect(
      await query(source, {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        "@id": "https://swapi.dev/api/people/1/",
        hair_color: "?",
      })
    ).toStrictEqual({
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      "@id": "https://swapi.dev/api/people/1/",
      hair_color: "blond",
    });
  });
});
