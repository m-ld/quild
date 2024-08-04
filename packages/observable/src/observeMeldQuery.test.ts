import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { clone, type MeldClone, uuid } from "@m-ld/m-ld";
import { NullRemotes } from "@m-ld/m-ld/ext/null";
import { MemoryLevel } from "memory-level";
import { map } from "rxjs";

import { observeMeldQuery } from "./observeMeldQuery";
import { emissions } from "./test-util/emissions";

describe(observeMeldQuery, () => {
  let meld: MeldClone;

  beforeAll(async () => {
    meld = await clone(new MemoryLevel(), NullRemotes, {
      "@id": uuid(),
      "@domain": "data.swapi.dev",
      genesis: true,
      logLevel: "warn",
    });
  });

  afterAll(async () => {
    await meld.close();
  });

  it("can observe a m-ld clone", async () => {
    const [first, second, third, fourth] = emissions(
      observeMeldQuery(meld, {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        name: "Luke Skywalker",
        hair_color: "?",
      } as const).pipe(map(({ data }) => data))
    );

    expect(await first).toStrictEqual(null);

    await meld.write({
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      "@update": {
        "@id": "https://swapi.dev/api/people/1/",
        hair_color: "blond",
      },
    });

    expect(await second).toStrictEqual(null);

    await meld.write({
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      "@update": {
        "@id": "https://swapi.dev/api/people/1/",
        name: "Luke Skywalker",
      },
    });

    expect(await third).toStrictEqual({
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      name: "Luke Skywalker",
      hair_color: "blond",
    });

    await meld.write({
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      "@update": {
        "@id": "https://swapi.dev/api/people/1/",
        hair_color: "brown",
      },
    });

    expect(await fourth).toStrictEqual({
      "@context": { "@vocab": "http://swapi.dev/documentation#" },
      name: "Luke Skywalker",
      hair_color: "brown",
    });
  });
});
