import { describe, expect, it } from "@jest/globals";

import { nullContext, parser } from "./common";
import { df } from "../common";

describe(parser.Document, () => {
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
      ctx: await nullContext(),
    };

    expect(await parser.Document(toParse)).toStrictEqual(
      await parser.NodeObject(toParse)
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
      ctx: await nullContext(),
    };

    expect(await parser.Document(toParse)).toStrictEqual(
      await parser.NodeObjectArray(toParse)
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
      ctx: await nullContext(),
    };

    expect(await parser.Document(toParse)).toStrictEqual(
      await parser.TopLevelGraphContainer(toParse)
    );
  });
});
