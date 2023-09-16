import { describe, it, expect } from "@jest/globals";
import jsonld, { type ContextSpec } from "jsonld";

import { NodeObject } from "./NodeObject";
import { type ToParse, nullContext, parsed, parseWarning } from "./common";
import { defaultParser, inherit } from "./parser";
import * as IR from "../IntermediateResult";
import { PLACEHOLDER, af, df } from "../common";
import { variableUnder } from "../variableUnder";

import type { JsonValue } from "type-fest";

const variable = df.variable("thing");

const makeToParse = async <Element extends JsonValue>(
  element: Element,
  ctxSpec: ContextSpec = {}
): Promise<ToParse<Element>> => ({
  element,
  variable,
  ctx: await jsonld.processContext(await nullContext(), ctxSpec),
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

  it("parses a literal entry", async () => {
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

  it("parses a literal entry (mapped term)", async () => {
    const toParse = await makeToParse(
      { name: "Luke Skywalker" },
      { name: "http://swapi.dev/documentation#name" }
    );

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.NodeObject({
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

  it("parses a placeholder entry", async () => {
    const toParse = await makeToParse({
      "http://swapi.dev/documentation#name": PLACEHOLDER,
    });

    const nameVariable = variableUnder(
      variable,
      "http://swapi.dev/documentation#name"
    );

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.NodeObject({
          "http://swapi.dev/documentation#name": new IR.NativePlaceholder(
            nameVariable
          ),
        }),
        patterns: [
          af.createPattern(
            variable,
            df.namedNode("http://swapi.dev/documentation#name"),
            nameVariable
          ),
        ],
        projections: [nameVariable],
      })
    );
  });

  it("parses a Node Object array entry", async () => {
    const toParse = await makeToParse(
      { film: [{ title: PLACEHOLDER }] },
      { "@vocab": "http://swapi.dev/documentation#" }
    );

    const filmVariable = variableUnder(variable, "film");
    const titleVariable = variableUnder(filmVariable, "title");

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.NodeObject({
          film: new IR.Plural(
            filmVariable,
            new IR.NodeObject({
              title: new IR.NativePlaceholder(titleVariable),
            })
          ),
        }),
        patterns: [
          af.createPattern(
            variable,
            df.namedNode("http://swapi.dev/documentation#film"),
            filmVariable
          ),
          af.createPattern(
            filmVariable,
            df.namedNode("http://swapi.dev/documentation#title"),
            titleVariable
          ),
        ],
        projections: [filmVariable, titleVariable],
      })
    );
  });

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
