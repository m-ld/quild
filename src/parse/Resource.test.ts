/* eslint-disable no-await-in-loop -- We use this for grouping `expect()`s */
import { describe, expect, it } from "@jest/globals";

import { Resource } from "./Resource";
import { type ToParse, nullContext, parsed, parseWarning } from "./common";
import { defaultParser, inherit } from "./parser";
import * as IR from "../IntermediateResult";
import { df } from "../common";

import type { JsonValue } from "type-fest";

const variable = df.variable("thing");
const makeToParse = async <Element extends JsonValue>(
  element: Element
): Promise<ToParse<Element>> => ({
  element,
  variable,
  ctx: await nullContext(),
});

describe(Resource, () => {
  const parser = inherit(defaultParser, { Resource });

  it("parses a string, number, or boolean", async () => {
    for (const element of ["Luke Skywalker", 10, true]) {
      const toParse = await makeToParse(element);

      expect(await parser.Resource(toParse)).toStrictEqual(
        await parser.Primitive(toParse)
      );
    }
  });

  it("parses a null", async () => {
    const toParse = await makeToParse(null);

    expect(await parser.Resource(toParse)).toStrictEqual(
      parsed({
        intermediateResult: new IR.NativeValue(null),
        term: variable,
        warnings: [
          parseWarning({
            message: "null values are not yet supported",
          }),
        ],
      })
    );
  });

  it("parses a Node Object", async () => {
    const toParse = await makeToParse({
      "@context": {
        "@vocab": "http://swapi.dev/documentation#",
      },
      name: "Luke Skywalker",
      height: "172",
    });

    expect(await parser.Resource(toParse)).toStrictEqual(
      await parser.NodeObject(toParse)
    );
  });

  it("parses a Graph Object, Value Object, List Object, or Set Object", async () => {
    const elements = [
      ["GraphObject", { "@graph": [] }],
      ["ValueObject", { "@value": "abc" }],
      ["ListObject", { "@list": [] }],
      ["SetObject", { "@set": [] }],
    ] as const;

    for (const [parseName, element] of elements) {
      const toParse = await makeToParse(element);

      expect(await parser.Resource(toParse)).toStrictEqual(
        await parser[parseName](toParse)
      );
    }
  });
});
