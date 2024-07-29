import { describe, it, expect } from "@jest/globals";
import jsonld from "jsonld";

import { df } from "./common";
import { readQuery } from "./index";
import { quadSource } from "./test-util/quadSource";
import data from "../fixtures/data.json";

import type * as RDF from "@rdfjs/types";
import type * as JsonLD from "jsonld";

/* eslint-disable @typescript-eslint/consistent-type-assertions
   ---
   We need to do a bit of type assertion to prepare the fixture data. */

// This madness is just to cope with the fact that jsonld.toRDF doesn't return
// real Quads. Namely, the "Quad" itself is missing its `termType`, and it and
// its terms are all missing the `.equals()` method. Also, BlankNodes are
// incorrectly named: they include the `_:`, which is not part of the name, but
// only part of the Turtle representation.
const fixQuad = (q: JsonLD.Quad): RDF.Quad => {
  const fixTerm = ((term: RDF.Term) =>
    term.termType === "Literal"
      ? df.literal(term.value, fixTerm(term.datatype))
      : term.termType === "BlankNode"
      ? df.blankNode(term.value.replace(/^_:/, ""))
      : df.fromTerm(term)) as typeof df.fromTerm;

  // Pretend q is a real quad for a moment.
  const quad = q as RDF.Quad;
  return df.quad(
    fixTerm(quad.subject),
    fixTerm(quad.predicate),
    fixTerm(quad.object),
    fixTerm(quad.graph)
  );
};

const quads = (await jsonld.toRDF(data as jsonld.JsonLdDocument)).map(fixQuad);
const source = quadSource(quads);

/* eslint-enable @typescript-eslint/consistent-type-assertions -- ^^^ */

describe(readQuery, () => {
  it("can query for a property by @id", async () => {
    expect(
      await readQuery(source, {
        "@id": "https://swapi.dev/api/people/1/",
        "http://swapi.dev/documentation#hair_color": "?",
        "http://swapi.dev/documentation#eye_color": "?",
      })
    ).toStrictEqual({
      data: {
        "@id": "https://swapi.dev/api/people/1/",
        "http://swapi.dev/documentation#hair_color": "blond",
        "http://swapi.dev/documentation#eye_color": "blue",
      },
      parseWarnings: [],
    });
  });

  it("can use names relative to a @base", async () => {
    expect(
      await readQuery(source, {
        "@context": { "@base": "https://swapi.dev/api/" },
        "@id": "people/1/",
        "http://swapi.dev/documentation#hair_color": "?",
        "http://swapi.dev/documentation#eye_color": "?",
      })
    ).toStrictEqual({
      data: {
        "@context": { "@base": "https://swapi.dev/api/" },
        "@id": "people/1/",
        "http://swapi.dev/documentation#hair_color": "blond",
        "http://swapi.dev/documentation#eye_color": "blue",
      },
      parseWarnings: [],
    });
  });

  it("can query for an @id by property", async () => {
    expect(
      await readQuery(source, {
        "@id": "?",
        "http://swapi.dev/documentation#hair_color": "blond",
        "http://swapi.dev/documentation#eye_color": "blue",
      })
    ).toStrictEqual({
      data: {
        "@id": "https://swapi.dev/api/people/1/",
        "http://swapi.dev/documentation#hair_color": "blond",
        "http://swapi.dev/documentation#eye_color": "blue",
      },
      parseWarnings: [],
    });
  });

  it("can query for a property by other properties", async () => {
    expect(
      await readQuery(source, {
        "http://swapi.dev/documentation#name": "Luke Skywalker",
        "http://swapi.dev/documentation#hair_color": "?",
        "http://swapi.dev/documentation#eye_color": "?",
      })
    ).toStrictEqual({
      data: {
        "http://swapi.dev/documentation#name": "Luke Skywalker",
        "http://swapi.dev/documentation#hair_color": "blond",
        "http://swapi.dev/documentation#eye_color": "blue",
      },
      parseWarnings: [],
    });
  });

  it("can query by @type", async () => {
    expect(
      await readQuery(source, [
        {
          "http://swapi.dev/documentation#name": "?",
          "@type": "http://swapi.dev/documentation#Person",
        },
      ])
    ).toStrictEqual({
      data: [
        {
          "@type": "http://swapi.dev/documentation#Person",
          "http://swapi.dev/documentation#name": "Luke Skywalker",
        },
        {
          "@type": "http://swapi.dev/documentation#Person",
          "http://swapi.dev/documentation#name": "Wedge Antilles",
        },
        {
          "@type": "http://swapi.dev/documentation#Person",
          "http://swapi.dev/documentation#name": "Owen Lars",
        },
      ],
      parseWarnings: [],
    });
  });

  it("can query for @type", async () => {
    expect(
      await readQuery(source, {
        "http://swapi.dev/documentation#name": "Luke Skywalker",
        "@type": "?",
      })
    ).toStrictEqual({
      data: {
        "http://swapi.dev/documentation#name": "Luke Skywalker",
        "@type": "http://swapi.dev/documentation#Person",
      },
      parseWarnings: [],
    });
  });

  it("respects @vocab when interpreting @type", async () => {
    expect(
      await readQuery(source, {
        "@context": {
          "@vocab": "http://swapi.dev/documentation#",
        },
        "@graph": [
          {
            "@type": "Person",
            name: "?",
            films: [
              {
                "@type": "?",
                title: "?",
              },
            ],
          },
        ],
      })
    ).toStrictEqual({
      data: {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        "@graph": [
          {
            "@type": "Person",
            name: "Luke Skywalker",
            films: [
              { "@type": "Film", title: "A New Hope" },
              { "@type": "Film", title: "The Empire Strikes Back" },
              { "@type": "Film", title: "Return of the Jedi" },
              { "@type": "Film", title: "Revenge of the Sith" },
            ],
          },
          {
            "@type": "Person",
            name: "Wedge Antilles",
            films: [
              { "@type": "Film", title: "A New Hope" },
              { "@type": "Film", title: "The Empire Strikes Back" },
              { "@type": "Film", title: "Return of the Jedi" },
            ],
          },
          {
            "@type": "Person",
            name: "Owen Lars",
            films: [
              { "@type": "Film", title: "A New Hope" },
              { "@type": "Film", title: "Attack of the Clones" },
              { "@type": "Film", title: "Revenge of the Sith" },
            ],
          },
        ],
      },
      parseWarnings: [],
    });
  });

  it("can access a singular related node", async () => {
    expect(
      await readQuery(source, {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        name: "Luke Skywalker",
        homeworld: { name: "?" },
      })
    ).toStrictEqual({
      data: {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        name: "Luke Skywalker",
        homeworld: {
          name: "Tatooine",
        },
      },
      parseWarnings: [],
    });
  });

  it("can query for multiple results", async () => {
    expect(
      await readQuery(source, [
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          eye_color: "blue",
          name: "?",
          height: "?",
        },
      ])
    ).toStrictEqual({
      data: [
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
      ],
      parseWarnings: [],
    });
  });

  it("can access a plural related node", async () => {
    expect(
      await readQuery(source, [
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          eye_color: "blue",
          name: "?",
          films: [{ title: "?" }],
        },
      ])
    ).toStrictEqual({
      data: [
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
      ],
      parseWarnings: [],
    });
  });

  it("can access a @set", async () => {
    expect(
      await readQuery(source, [
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          eye_color: "blue",
          name: "?",
          films: { "@set": [{ title: "?" }] },
        },
      ])
    ).toStrictEqual({
      data: [
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          eye_color: "blue",
          name: "Luke Skywalker",
          films: {
            "@set": [
              { title: "A New Hope" },
              { title: "The Empire Strikes Back" },
              { title: "Return of the Jedi" },
              { title: "Revenge of the Sith" },
            ],
          },
        },
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          eye_color: "blue",
          name: "Owen Lars",
          films: {
            "@set": [
              { title: "A New Hope" },
              { title: "Attack of the Clones" },
              { title: "Revenge of the Sith" },
            ],
          },
        },
      ],
      parseWarnings: [],
    });
  });

  it("can access a context-defined @set", async () => {
    expect(
      await readQuery(source, [
        {
          "@context": {
            "@vocab": "http://swapi.dev/documentation#",
            films: { "@container": "@set" },
          },
          eye_color: "blue",
          name: "?",
          films: [{ title: "?" }],
        },
      ])
    ).toStrictEqual({
      data: [
        {
          "@context": {
            "@vocab": "http://swapi.dev/documentation#",
            films: { "@container": "@set" },
          },
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
          "@context": {
            "@vocab": "http://swapi.dev/documentation#",
            films: { "@container": "@set" },
          },
          eye_color: "blue",
          name: "Owen Lars",
          films: [
            { title: "A New Hope" },
            { title: "Attack of the Clones" },
            { title: "Revenge of the Sith" },
          ],
        },
      ],
      parseWarnings: [],
    });
  });

  it("can fail to match a singular query", async () => {
    expect(
      await readQuery(source, {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        eye_color: "purple",
        name: "?",
      })
    ).toStrictEqual({ data: null, parseWarnings: [] });
  });

  it("requires singular child nodes to match", async () => {
    expect(
      await readQuery(source, [
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          eye_color: "blue",
          name: "?",
          films: { title: "The Phantom Menace" },
        },
      ])
    ).toStrictEqual({ data: [], parseWarnings: [] });
  });

  it("allows plural child nodes not to match", async () => {
    expect(
      await readQuery(source, [
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          eye_color: "blue",
          name: "?",
          films: [
            {
              title: "The Empire Strikes Back",
              director: "?",
            },
          ],
        },
      ])
    ).toStrictEqual({
      data: [
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          eye_color: "blue",
          name: "Luke Skywalker",
          films: [
            {
              title: "The Empire Strikes Back",
              director: "Irvin Kershner",
            },
          ],
        },
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          eye_color: "blue",
          name: "Owen Lars",
          films: [],
        },
      ],
      parseWarnings: [],
    });
  });

  it("preserves the contexts used in the query", async () => {
    expect(
      await readQuery(source, {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        "@id": "https://swapi.dev/api/people/1/",
        hair_color: "?",
        homeworld: {
          "@context": { planetName: "http://swapi.dev/documentation#name" },
          planetName: "?",
        },
      })
    ).toStrictEqual({
      data: {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        "@id": "https://swapi.dev/api/people/1/",
        hair_color: "blond",
        homeworld: {
          "@context": { planetName: "http://swapi.dev/documentation#name" },
          planetName: "Tatooine",
        },
      },
      parseWarnings: [],
    });
  });

  it("can query for a @list", async () => {
    expect(
      await readQuery(source, {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        "@id": "https://swapi.dev/api/vehicles/14/",
        pilots: {
          "@list": [{ name: "?" }],
        },
      })
    ).toStrictEqual({
      data: {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        "@id": "https://swapi.dev/api/vehicles/14/",
        pilots: {
          "@list": [{ name: "Luke Skywalker" }, { name: "Wedge Antilles" }],
        },
      },
      parseWarnings: [],
    });
  });

  it("can query for a @list", async () => {
    expect(
      await readQuery(source, {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        "@id": "https://swapi.dev/api/vehicles/14/",
        pilots: {
          "@list": [{ name: "?" }],
        },
      })
    ).toStrictEqual({
      data: {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        "@id": "https://swapi.dev/api/vehicles/14/",
        pilots: {
          "@list": [{ name: "Luke Skywalker" }, { name: "Wedge Antilles" }],
        },
      },
      parseWarnings: [],
    });
  });

  it("can filter a @list", async () => {
    expect(
      await readQuery(source, {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        "@id": "https://swapi.dev/api/vehicles/14/",
        pilots: {
          "@list": [{ hair_color: "brown", name: "?" }],
        },
      })
    ).toStrictEqual({
      data: {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        "@id": "https://swapi.dev/api/vehicles/14/",
        pilots: {
          "@list": [{}, { hair_color: "brown", name: "Wedge Antilles" }],
        },
      },
      parseWarnings: [],
    });
  });
});
