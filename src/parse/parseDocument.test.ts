import { describe, expect, it } from "@jest/globals";

import { nullContext } from "./common";
import { parseDocument } from "./parseDocument";
import { parseNodeObject } from "./parseNodeObject";
import { parseNodeObjectArray } from "./parseNodeObjectArray";
import { parseTopLevelGraphContainer } from "./parseTopLevelGraphContainer";
import { df } from "../common";

describe(parseDocument, () => {
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

    expect(await parseDocument(toParse)).toStrictEqual(
      await parseNodeObject(toParse)
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

    expect(await parseDocument(toParse)).toStrictEqual(
      await parseNodeObjectArray(toParse)
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

    expect(await parseDocument(toParse)).toStrictEqual(
      await parseTopLevelGraphContainer(toParse)
    );
  });
});
