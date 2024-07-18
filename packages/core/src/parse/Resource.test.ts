import { describe, expect, it } from "@jest/globals";

import { Resource } from "./Resource";
import {
  type ToParse,
  nullContext,
  parsed,
  parseWarning,
  type Parse,
} from "./common";
import { makeParser } from "./parser";
import * as IR from "../IntermediateResult";
import { df } from "../common";

import type { JsonValue, ValueOf } from "type-fest";

const variable = df.variable("thing");
const makeToParse = <Element extends JsonValue>(
  element: Element
): ToParse<Element> => ({
  element,
  variable,
  ctx: nullContext,
});

describe(Resource, () => {
  const parser = makeParser({ Resource });

  it("parses a null", async () => {
    const toParse = makeToParse(null);

    expect(await parser.Resource(toParse)).toStrictEqual(
      parsed({
        intermediateResult: new IR.LiteralValue(null),
        term: variable,
        warnings: [
          parseWarning({
            message: "null values are not yet supported",
          }),
        ],
      })
    );
  });

  type TestCase = ValueOf<{
    [ParseName in keyof typeof parser]: {
      name: string;
      parse: (typeof parser)[ParseName];
      element: (typeof parser)[ParseName] extends Parse<infer Element>
        ? Element
        : never;
    };
  }>;

  it.each([
    { name: "string", parse: parser.Primitive, element: "Luke Skywalker" },
    { name: "number", parse: parser.Primitive, element: 10 },
    { name: "boolean", parse: parser.Primitive, element: true },
    {
      name: "Node Object",
      parse: parser.NodeObject,
      element: {
        "@context": { "@vocab": "http://swapi.dev/documentation#" },
        name: "Luke Skywalker",
        height: "172",
      },
    },
    {
      name: "Graph Object",
      parse: parser.GraphObject,
      element: { "@graph": [] },
    },
    {
      name: "Value Object",
      parse: parser.ValueObject,
      element: { "@value": "abc" },
    },
    {
      name: "List Object",
      parse: parser.ListObject,
      element: { "@list": [{}] },
    },
    { name: "Set Object", parse: parser.SetObject, element: { "@set": [{}] } },
  ] satisfies TestCase[])("parses a $name", async ({ element, parse }) => {
    const toParse = makeToParse(element);

    expect(await parser.Resource(toParse)).toStrictEqual(
      // @ts-expect-error - It seems to be impossible to convince TS that
      // `toParse` will always be an appropriate value for `parse` to parse.
      await parse.bind(parser)(toParse)
    );
  });
});
