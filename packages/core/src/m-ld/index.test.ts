import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { clone, type MeldClone, type MeldState, uuid } from "@m-ld/m-ld";
import { NullRemotes } from "@m-ld/m-ld/ext/null";
import jsonld, { type JsonLdDocument } from "jsonld";
import { MemoryLevel } from "memory-level";

import { parser as meldParser } from "./parse";
import data from "../../fixtures/data.json";
import { readQuery } from "../index";

describe(readQuery, () => {
  let meld: MeldClone;
  let meldState: MeldState;

  beforeAll(async () => {
    meld = await clone(new MemoryLevel(), NullRemotes, {
      "@id": uuid(),
      "@domain": "data.swapi.dev",
      genesis: true,
    });

    /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
       ---
       Annoyingly, the inferred type of `data` doesn't quite line up with
       `JsonLdDocument`. */
    const compactedData = await jsonld.compact(data as JsonLdDocument, {});
    meldState = await meld.write(compactedData);
  });

  afterAll(async () => {
    await meld.close();
  });

  it("can query for a @list", async () => {
    expect(
      await readQuery(
        meldState,
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          "@id": "https://swapi.dev/api/vehicles/14/",
          pilots: {
            "@list": [{ name: "?" }],
          },
        },
        { parser: meldParser }
      )
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

  it("can query for a context-defined @list", async () => {
    expect(
      await readQuery(
        meldState,
        {
          "@context": {
            "@vocab": "http://swapi.dev/documentation#",
            pilots: { "@container": "@list" },
          },
          "@id": "https://swapi.dev/api/vehicles/14/",
          pilots: [{ name: "?" }],
        },
        { parser: meldParser }
      )
    ).toStrictEqual({
      data: {
        "@context": {
          "@vocab": "http://swapi.dev/documentation#",
          pilots: { "@container": "@list" },
        },
        "@id": "https://swapi.dev/api/vehicles/14/",
        pilots: [{ name: "Luke Skywalker" }, { name: "Wedge Antilles" }],
      },
      parseWarnings: [],
    });
  });

  it("can filter a @list", async () => {
    expect(
      await readQuery(
        meldState,
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          "@id": "https://swapi.dev/api/vehicles/14/",
          pilots: {
            "@list": [{ hair_color: "brown", name: "?" }],
          },
        },
        { parser: meldParser }
      )
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
