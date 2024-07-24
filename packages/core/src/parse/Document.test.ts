import { describe, expect, it } from "@jest/globals";

import { Document } from "./Document";
import { nullContext } from "./common";
import { makeParser } from "./parser";
import { df } from "../common";
import { foo } from "../test-util/toTurtle";

console.log(foo);

describe(Document, () => {
  const parser = makeParser({ Document });

  it("parses a Document that's a Node Object", async () => {
    const toParse = {
      element: {
        "@context": {
          "@vocab": "http://swapi.dev/documentation#",
        },
        name: "Luke Skywalker",
        height: "172",
      },
      variable: df.variable("luke"),
      ctx: nullContext,
    };

    expect(await parser.Document(toParse)).toStrictEqual(
      await parser.NodeObject(toParse),
    );
  });

  it("parses a Document that's a Node Object Array", async () => {
    const toParse = {
      element: [
        {
          "@context": {
            "@vocab": "http://swapi.dev/documentation#",
          },
          name: "Luke Skywalker",
          height: "172",
        },
      ],
      variable: df.variable("luke"),
      ctx: nullContext,
    };

    expect(await parser.Document(toParse)).toStrictEqual(
      await parser.NodeObjectArray(toParse),
    );
  });

  it("parses a Document that's a Top-Level Graph Container", async () => {
    const toParse = {
      element: {
        "@context": {
          "@vocab": "http://swapi.dev/documentation#",
        },
        "@graph": [
          {
            name: "Luke Skywalker",
            height: "172",
          },
        ],
      },
      variable: df.variable("luke"),
      ctx: nullContext,
    };

    expect(await parser.Document(toParse)).toStrictEqual(
      await parser.TopLevelGraphContainer(toParse),
    );
  });
});
