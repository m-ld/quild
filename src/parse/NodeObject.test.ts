import { describe, it, expect } from "@jest/globals";

import { NodeObject } from "./NodeObject";
import { type ToParse, nullContext, parsed, parseWarning } from "./common";
import { defaultParser, inherit } from "./parser";
import * as IR from "../IntermediateResult";
import { af, df } from "../common";

import type { JsonValue } from "type-fest";

const variable = df.variable("thing");
const makeToParse = async <Element extends JsonValue>(
  element: Element
): Promise<ToParse<Element>> => ({
  element,
  variable,
  ctx: await nullContext(),
});

describe(NodeObject, () => {
  const parser = inherit(defaultParser, { NodeObject });

  it("parses a @context entry", async () => {
    const toParse = await makeToParse({
      "@context": {
        "@vocab": "http://swapi.dev/documentation#",
      },
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.NodeObject({
          "@context": new IR.NativeValue({
            "@vocab": "http://swapi.dev/documentation#",
          }),
        }),
      })
    );
  });

  it("parses a Resource entry", async () => {
    const toParse = await makeToParse({
      "http://swapi.dev/documentation#name": "Luke Skywalker",
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.NodeObject({
          "http://swapi.dev/documentation#name": new IR.NativeValue(
            "Luke Skywalker"
          ),
        }),
        patterns: [
          af.createPattern(
            variable,
            df.namedNode("http://swapi.dev/documentation#name"),
            df.literal("Luke Skywalker")
          ),
        ],
      })
    );
  });

  it("parses a Resource entry (mapped term)", async () => {
    const toParse = await makeToParse({
      "@context": {
        name: "http://swapi.dev/documentation#name",
      },
      name: "Luke Skywalker",
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.NodeObject({
          "@context": new IR.NativeValue({
            name: "http://swapi.dev/documentation#name",
          }),
          name: new IR.NativeValue("Luke Skywalker"),
        }),
        patterns: [
          af.createPattern(
            variable,
            df.namedNode("http://swapi.dev/documentation#name"),
            df.literal("Luke Skywalker")
          ),
        ],
      })
    );
  });

  it.todo("parses a Resource array entry");

  it("parses an @id entry", async () => {
    const toParse = await makeToParse({
      "@id": "https://swapi.dev/api/people/1/",
      "http://swapi.dev/documentation#name": "Luke Skywalker",
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.NodeObject({
          "@id": new IR.NativeValue("https://swapi.dev/api/people/1/"),
          "http://swapi.dev/documentation#name": new IR.NativeValue(
            "Luke Skywalker"
          ),
        }),
        patterns: [
          af.createPattern(
            df.namedNode("https://swapi.dev/api/people/1/"),
            df.namedNode("http://swapi.dev/documentation#name"),
            df.literal("Luke Skywalker")
          ),
        ],
      })
    );
  });

  it("parses an @id entry (mapped term)", async () => {
    const toParse = await makeToParse({
      "@context": {
        url: "@id",
      },
      "@id": "https://swapi.dev/api/people/1/",
      "http://swapi.dev/documentation#name": "Luke Skywalker",
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.NodeObject({
          "@context": new IR.NativeValue({
            url: "@id",
          }),
          "@id": new IR.NativeValue("https://swapi.dev/api/people/1/"),
          "http://swapi.dev/documentation#name": new IR.NativeValue(
            "Luke Skywalker"
          ),
        }),
        patterns: [
          af.createPattern(
            df.namedNode("https://swapi.dev/api/people/1/"),
            df.namedNode("http://swapi.dev/documentation#name"),
            df.literal("Luke Skywalker")
          ),
        ],
      })
    );
  });

  it.todo("parses a Language Map entry");

  it.todo("parses an Index Map entry");

  it.todo("parses an Included Block entry");

  it.todo("parses an Included Block entry");

  it.todo("parses an Id Map entry");

  it.todo("parses an Type Map entry");

  it("parses an unknown entry", async () => {
    const toParse = await makeToParse({
      bogus: "abc123",
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.NodeObject({
          bogus: new IR.NativeValue("abc123"),
        }),
        warnings: [
          parseWarning({
            message: "Key not defined by context and ignored",
            path: ["bogus"],
          }),
        ],
      })
    );
  });
});
