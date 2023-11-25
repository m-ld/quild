import { describe, expect, it } from "@jest/globals";

import { SetObject } from "./SetObject";
import { nullContext } from "./common";
import { defaultParser, inherit } from "./parser";
import { df } from "../common";

describe(SetObject, () => {
  const parser = inherit(defaultParser, { SetObject });

  // A Set can be used for:
  // * A plural/optional placeholder: { "@set": ["?"] }
  // * An alternation matcher: { "@set": ["George Lucas", "Irvin Kershner"] }
  //   NOTE: There's no way to say "with all of these values", without using
  //   multiple NodeObject entries.
  // * A plural/optional child query: { "@set": [{ "director": "?" }] }

  const _noodling = [
    {
      "->": { "@set": ["?"] },
      "<-": { "@set": ["George Lucas", "Irvin Kershner"] },
    },
    {
      "->": {
        "@set": ["?"],
        "@count": "?",
      },
      "<-": {
        "@set": ["George Lucas", "Irvin Kershner"],
        "@count": 2,
      },
    },
    {
      "->": {
        "@set": "?",
        "@count": "?",
      },
      "<-": {
        "@set": [],
        "@count": 2,
      },
    },
  ];

  it("parses a SetObject TK", async () => {
    const toParse = {
      element: { "@set": [] },
      variable: df.variable("luke"),
      ctx: nullContext,
    };

    expect(await parser.Document(toParse)).toStrictEqual(
      await parser.NodeObject(toParse)
    );
  });
  //   it("parses a Document that's a Node Object Array", async () => {
  //     const toParse = {
  //       element: [
  //         {
  //           "@context": {
  //             "@vocab": "http://swapi.dev/documentation#",
  //           },
  //           name: "Luke Skywalker",
  //           height: "172",
  //         },
  //       ],
  //       variable: df.variable("luke"),
  //       ctx: nullContext,
  //     };
  //     expect(await parser.Document(toParse)).toStrictEqual(
  //       await parser.NodeObjectArray(toParse)
  //     );
  //   });
  //   it("parses a Document that's a Top-Level Graph Container", async () => {
  //     const toParse = {
  //       element: {
  //         "@context": {
  //           "@vocab": "http://swapi.dev/documentation#",
  //         },
  //         "@graph": [
  //           {
  //             name: "Luke Skywalker",
  //             height: "172",
  //           },
  //         ],
  //       },
  //       variable: df.variable("luke"),
  //       ctx: nullContext,
  //     };
  //     expect(await parser.Document(toParse)).toStrictEqual(
  //       await parser.TopLevelGraphContainer(toParse)
  //     );
  //   });
});
