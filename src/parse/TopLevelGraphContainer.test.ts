import { describe, expect, it } from "@jest/globals";

import { TopLevelGraphContainer } from "./TopLevelGraphContainer";
import { type Parsed, contextParser, nullContext } from "./common";
import { defaultParser, inherit } from "./parser";
import * as IR from "../IntermediateResult";
import { df } from "../common";

describe(TopLevelGraphContainer, () => {
  const parser = inherit(defaultParser, { TopLevelGraphContainer });

  it("parses a top-level graph container without a @context", async () => {
    const toParse = {
      element: {
        "@graph": [
          {
            "@context": { "@vocab": "http://swapi.dev/documentation#" },
            name: "Luke Skywalker",
            eye_color: "blue",
            height: "?",
          },
        ],
      },
      variable: df.variable("root"),
      ctx: nullContext,
    };

    const parsedNodeObjectArray = await parser.NodeObjectArray({
      element: [
        {
          "@context": { "@vocab": "http://swapi.dev/documentation#" },
          name: "Luke Skywalker",
          eye_color: "blue",
          height: "?",
        },
      ],
      variable: df.variable("root"),
      ctx: nullContext,
    });

    expect<Parsed<IR.Object>>(
      await parser.TopLevelGraphContainer(toParse)
    ).toStrictEqual({
      ...parsedNodeObjectArray,
      intermediateResult: new IR.Object({
        "@graph": parsedNodeObjectArray.intermediateResult,
      }),
    });
  });

  it("parses a top-level graph container with a @context", async () => {
    const toParse = {
      element: {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        "@graph": [
          {
            name: "Luke Skywalker",
            eye_color: "blue",
            height: "?",
          },
        ],
      },
      variable: df.variable("root"),
      ctx: nullContext,
    };

    const parsedNodeObjectArray = await parser.NodeObjectArray({
      element: [
        {
          name: "Luke Skywalker",
          eye_color: "blue",
          height: "?",
        },
      ],
      variable: df.variable("root"),
      ctx: await contextParser.parse({
        "@vocab": "http://swapi.dev/documentation#",
      }),
    });

    expect<Parsed<IR.Object>>(
      await parser.TopLevelGraphContainer(toParse)
    ).toStrictEqual({
      ...parsedNodeObjectArray,
      intermediateResult: new IR.Object({
        "@context": new IR.LiteralValue({
          "@vocab": "http://swapi.dev/documentation#",
        }),
        "@graph": parsedNodeObjectArray.intermediateResult,
      }),
    });
  });
});
