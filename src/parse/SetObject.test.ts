import { describe, expect, it } from "@jest/globals";

import { SetObject } from "./SetObject";
import { type ToParse, contextParser } from "./common";
import { makeParser } from "./parser";
import * as IR from "../IntermediateResult";
import { df } from "../common";

import type { JsonLdContext } from "jsonld-context-parser";
import type { JsonValue } from "type-fest";

const variable = df.variable("thing");
const makeToParse = async <Element extends JsonValue>(
  element: Element,
  ctxDef: JsonLdContext = {}
): Promise<ToParse<Element>> => ({
  element,
  variable,
  ctx: await contextParser.parse(ctxDef),
});

describe(SetObject, () => {
  const parser = makeParser({ SetObject });

  it("TK", async () => {
    const toParse = await makeToParse(
      { "@set": [{ name: "?" }] },
      { "@vocab": "http://swapi.dev/documentation#" }
    );

    const parsedArray = await parser.NodeObjectArray(
      await makeToParse([{ name: "?" }], {
        "@vocab": "http://swapi.dev/documentation#",
      })
    );

    expect(await parser.SetObject(toParse)).toStrictEqual({
      ...parsedArray,
      intermediateResult: new IR.Object({
        "@set": parsedArray.intermediateResult,
      }),
    });
  });
});
