import { describe, it, expect } from "@jest/globals";
import jsonld from "jsonld";

import { df } from "./common";
import { query } from "./index";
import data from "../fixtures/data.json";
import { dataset } from "../test-util/fixedDataset";

import type { Quad, Term } from "@rdfjs/types";
import type * as JsonLD from "jsonld";

// This madness is just to cope with the fact that jsonld.toRDF doesn't return
// real Quads. Namely, the "Quad" itself is missing its `termType`, and it and
// its terms are all missing the `.equals()` method.
const fixQuad = (q: JsonLD.Quad): Quad => {
  const fixTerm = ((term: Term) =>
    term.termType === "Literal"
      ? df.literal(term.value, term.datatype)
      : term.termType === "BlankNode"
      ? df.blankNode(term.value.replace(/^_:/, ""))
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
});
