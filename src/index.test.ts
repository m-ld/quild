import { describe, it, expect } from "@jest/globals";
import jsonld from "jsonld";

import { fixQuad, query } from "./index";
import data from "../fixtures/data.json";
import { dataset } from "../test-util/fixedDataset";

const quads = (await jsonld.toRDF(data as jsonld.JsonLdDocument)).map(fixQuad);
const source = dataset().addAll(quads);

// TODO: BIG OPEN QUESTION:
// What happens if something doesn't match?

describe("query()", () => {
  it("can query for a property by @id", async () => {
    expect(
      await query(source, {
        "@id": "https://swapi.dev/api/people/1/",
        "http://swapi.dev/documentation#hair_color": "?",
        "http://swapi.dev/documentation#eye_color": "?",
      })
    ).toStrictEqual({
      "@id": "https://swapi.dev/api/people/1/",
      "http://swapi.dev/documentation#hair_color": "blond",
      "http://swapi.dev/documentation#eye_color": "blue",
    });
  });

  it("can query for a property by other properties", async () => {
    expect(
      await query(source, {
        "http://swapi.dev/documentation#name": "Luke Skywalker",
        "http://swapi.dev/documentation#hair_color": "?",
        "http://swapi.dev/documentation#eye_color": "?",
      })
    ).toStrictEqual({
      "http://swapi.dev/documentation#name": "Luke Skywalker",
      "http://swapi.dev/documentation#hair_color": "blond",
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
      name: "Luke Skywalker",
      homeworld: {
        name: "Tatooine",
      },
    });
  });

  it("can query for multiple results", async () => {
    expect(
      await query(source, [
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          eye_color: "blue",
          name: "?",
          height: "?",
        },
      ])
    ).toStrictEqual([
      {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        eye_color: "blue",
        name: "Luke Skywalker",
        height: 172,
      },
      {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        eye_color: "blue",
        name: "Owen Lars",
        height: 178,
      },
    ]);
  });

  it("can access a plural related node", async () => {
    expect(
      await query(source, [
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          eye_color: "blue",
          name: "?",
          films: [{ title: "?" }],
        },
      ])
    ).toStrictEqual([
      {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        eye_color: "blue",
        name: "Luke Skywalker",
        films: [
          { title: "A New Hope" },
          { title: "The Empire Strikes Back" },
          { title: "Return of the Jedi" },
          { title: "Revenge of the Sith" },
        ],
      },
      {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        eye_color: "blue",
        name: "Owen Lars",
        films: [
          { title: "A New Hope" },
          { title: "Attack of the Clones" },
          { title: "Revenge of the Sith" },
        ],
      },
    ]);
  });

  it("preserves the contexts used in the query", async () => {
    expect(
      await query(source, {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        "@id": "https://swapi.dev/api/people/1/",
        hair_color: "?",
        homeworld: {
          "@context": { planetName: "http://swapi.dev/documentation#name" },
          planetName: "?",
        },
      })
    ).toStrictEqual({
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      "@id": "https://swapi.dev/api/people/1/",
      hair_color: "blond",
      homeworld: {
        "@context": { planetName: "http://swapi.dev/documentation#name" },
        planetName: "Tatooine",
      },
    });
  });

  // it("REPRO", async () => {
  //   const engine = new QueryEngine();

  //   const bindingsMatching = async (sparql: string | Algebra.Operation) =>
  //     readAll(
  //       await engine.queryBindings(sparql, {
  //         sources: [source],
  //       })
  //     );

  //   const sparql = /* sparql */ `
  //     PREFIX swapi: <http://swapi.dev/documentation#>
  //     SELECT ?eye_color WHERE {
  //       [] swapi:name "Luke Skywalker";
  //          swapi:eye_color ?eye_color .
  //     }
  //   `;

  //   // Why didn't this fail?
  //   // Moot: We'll need to get the node as a variable anyhow, so we can
  //   // distinguish nodes.
  //   expect(bindingsMatching(translate(sparql))).toStrictEqual(
  //     bindingsMatching(sparql)
  //   );
  // });
});
