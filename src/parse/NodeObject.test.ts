/* eslint-disable no-await-in-loop -- We use this for grouping `expect()`s */
import { describe, it, expect } from "@jest/globals";

import { NodeObject } from "./NodeObject";
import {
  type ToParse,
  parsed,
  parseWarning,
  nestWarningsUnderKey,
  contextParser,
} from "./common";
import { defaultParser, inherit } from "./parser";
import * as IR from "../IntermediateResult";
import { PLACEHOLDER, af, df } from "../common";
import { variableUnder } from "../variableUnder";

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
    const children = [
      PLACEHOLDER,
      // string
      "Luke Skywalker",
      // number
      10,
      // boolean
      true,
      // node object,
      { "http://swapi.dev/documentation#name": "Luke Skywalker" },
      // graph object,
      { "@graph": [] },
      // value object,
      { "@value": "abc" },
      // list object,
      { "@list": [] },
      // set object,
      { "@set": [] },
    ];

    for (const child of children) {
      const toParse = await makeToParse({
        "http://example.com/value": child,
      });

      const childVariable = variableUnder(variable, "http://example.com/value");

      const resource = await parser.Resource({
        element: child,
        variable: childVariable,
        ctx: toParse.ctx,
      });

      expect(await parser.NodeObject(toParse)).toStrictEqual(
        parsed({
          term: variable,
          intermediateResult: new IR.NodeObject({
            "http://example.com/value": resource.intermediateResult,
          }),
          patterns: [
            af.createPattern(
              variable,
              df.namedNode("http://example.com/value"),
              resource.term
            ),
            ...resource.patterns,
          ],
          projections: resource.projections,
          warnings: nestWarningsUnderKey("http://example.com/value")(
            resource.warnings
          ),
        })
      );
    }
  });

  it("uses terms in the @context", async () => {
    const toParse = await makeToParse(
      { name: "Luke Skywalker" },
      { name: "http://swapi.dev/documentation#name" }
    );

    const childVariable = variableUnder(
      variable,
      "http://swapi.dev/documentation#name"
    );

    const resource = await parser.Resource({
      element: "Luke Skywalker",
      variable: childVariable,
      ctx: toParse.ctx,
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.NodeObject({
          name: resource.intermediateResult,
        }),
        patterns: [
          af.createPattern(
            variable,
            df.namedNode("http://swapi.dev/documentation#name"),
            resource.term
          ),
          ...resource.patterns,
        ],
        projections: resource.projections,
      })
    );
  });

  it("parses a context-defined Named Graph, List, or Set", async () => {
    const tk = [
      // Named Graph
      {
        value: [
          { "http://swapi.dev/documentation#name": "Luke Skywalker" },
          { "http://swapi.dev/documentation#name": "Owen Lars" },
        ],
        termDefinition: { "@container": "@graph" },
        expandedValue: {
          "@graph": [
            { "http://swapi.dev/documentation#name": "Luke Skywalker" },
            { "http://swapi.dev/documentation#name": "Owen Lars" },
          ],
        },
      },
      // List
      {
        value: [
          { "http://swapi.dev/documentation#name": "Luke Skywalker" },
          { "http://swapi.dev/documentation#name": "Owen Lars" },
        ],
        termDefinition: { "@container": "@list" },
        expandedValue: {
          "@list": [
            { "http://swapi.dev/documentation#name": "Luke Skywalker" },
            { "http://swapi.dev/documentation#name": "Owen Lars" },
          ],
        },
      },
      // Set
      {
        value: [
          { "http://swapi.dev/documentation#name": "Luke Skywalker" },
          { "http://swapi.dev/documentation#name": "Owen Lars" },
        ],
        termDefinition: { "@container": "@set" },
        expandedValue: {
          "@set": [
            { "http://swapi.dev/documentation#name": "Luke Skywalker" },
            { "http://swapi.dev/documentation#name": "Owen Lars" },
          ],
        },
      },
    ] as const;

    for (const { value, termDefinition, expandedValue } of tk) {
      const toParse = await makeToParse(
        { "http://example.com/thing": value },
        { "http://example.com/thing": termDefinition }
      );

      const childVariable = variableUnder(variable, "http://example.com/thing");

      const resource = await parser.Resource({
        element: expandedValue,
        variable: childVariable,
        ctx: toParse.ctx,
      });

      expect(await parser.NodeObject(toParse)).toStrictEqual(
        parsed({
          term: variable,
          intermediateResult: new IR.NodeObject({
            "http://example.com/thing": resource.intermediateResult,
          }),
          patterns: [
            af.createPattern(
              variable,
              df.namedNode("http://example.com/thing"),
              resource.term
            ),
            ...resource.patterns,
          ],
          projections: resource.projections,
          warnings: nestWarningsUnderKey("http://example.com/thing")(
            resource.warnings
          ),
        })
      );
    }
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
