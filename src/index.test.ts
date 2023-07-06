import { describe, it, expect } from "@jest/globals";
import jsonld from "jsonld";

import { dataset } from "./fixedDataset.testutil";

import { fixQuad, query } from "./index";

const data = {
  "@context": {
    "@vocab": "http://swapi.dev/documentation#",
    url: "@id",
    height: { "@type": "xsd:integer" },
    mass: { "@type": "xsd:integer" },
    vehicles: { "@type": "@id" },
  },
  name: "Luke Skywalker",
  height: "172",
  mass: "77",
  hair_color: "blond",
  skin_color: "fair",
  eye_color: "blue",
  birth_year: "19BBY",
  gender: "male",
  homeworld: "https://swapi.dev/api/planets/1/",
  films: [
    "https://swapi.dev/api/films/1/",
    "https://swapi.dev/api/films/2/",
    "https://swapi.dev/api/films/3/",
    "https://swapi.dev/api/films/6/",
  ],
  species: [],
  vehicles: [
    "https://swapi.dev/api/vehicles/14/",
    "https://swapi.dev/api/vehicles/30/",
  ],
  starships: [
    "https://swapi.dev/api/starships/12/",
    "https://swapi.dev/api/starships/22/",
  ],
  created: "2014-12-09T13:50:51.644000Z",
  edited: "2014-12-20T21:17:56.891000Z",
  url: "https://swapi.dev/api/people/1/",
};

const quads = (await jsonld.toRDF(data)).map(fixQuad);
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
});
