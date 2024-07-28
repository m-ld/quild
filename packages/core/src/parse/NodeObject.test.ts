import { describe, it, expect } from "@jest/globals";

import { NodeObject } from "./NodeObject";
import { addToRight } from "./addToRight";
import {
  type ToParse,
  parsed,
  parseWarning,
  nestWarningsUnderKey,
  contextParser,
  nullContext,
} from "./common";
import { makeParser } from "./parser";
import * as IR from "../IntermediateResult";
import { PLACEHOLDER, af, df, type } from "../common";
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
  const parser = makeParser({ NodeObject });

  it("parses a @context entry", async () => {
    const toParse = await makeToParse({
      "@context": {
        "@vocab": "http://swapi.dev/documentation#",
      },
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.Object({
          "@context": new IR.LiteralValue({
            "@vocab": "http://swapi.dev/documentation#",
          }),
        }),
      })
    );
  });

  it.each([
    { desc: "placeholder", child: PLACEHOLDER },
    { desc: "string", child: "Luke Skywalker" },
    { desc: "number", child: 10 },
    { desc: "boolean", child: true },
    {
      desc: "node object",
      child: { "http://swapi.dev/documentation#name": "Luke Skywalker" },
    },
    { desc: "graph object", child: { "@graph": [] } },
    { desc: "value object", child: { "@value": "abc" } },
    { desc: "list object", child: { "@list": [{}] } },
    { desc: "set object", child: { "@set": [{}] } },
  ])("parses a $desc entry", async ({ child }) => {
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
        intermediateResult: new IR.Object({
          "http://example.com/value": resource.intermediateResult,
        }),
        operation: af.createJoin([
          addToRight(
            af.createBgp([
              af.createPattern(
                variable,
                df.namedNode("http://example.com/value"),
                resource.term
              ),
            ]),
            resource.operation
          ),
        ]),
        projections: resource.projections,
        warnings: nestWarningsUnderKey("http://example.com/value")(
          resource.warnings
        ),
      })
    );
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
        intermediateResult: new IR.Object({
          name: resource.intermediateResult,
        }),
        operation: af.createJoin([
          af.createBgp([
            af.createPattern(
              variable,
              df.namedNode("http://swapi.dev/documentation#name"),
              resource.term
            ),
          ]),
          resource.operation,
        ]),
        projections: resource.projections,
      })
    );
  });

  it.each([
    {
      description: "Named Graph",
      value: [
        { "http://swapi.dev/documentation#name": "Luke Skywalker" },
        { "http://swapi.dev/documentation#name": "Owen Lars" },
      ],
      container: "@graph",
      expandedValue: {
        "@graph": [
          { "http://swapi.dev/documentation#name": "Luke Skywalker" },
          { "http://swapi.dev/documentation#name": "Owen Lars" },
        ],
      },
    },
    {
      description: "List",
      value: [{ "http://swapi.dev/documentation#name": "Luke Skywalker" }],
      container: "@list",
      expandedValue: {
        "@list": [{ "http://swapi.dev/documentation#name": "Luke Skywalker" }],
      },
    },
    {
      description: "Set",
      value: [{ "http://swapi.dev/documentation#name": "Luke Skywalker" }],
      container: "@set",
      expandedValue: {
        "@set": [{ "http://swapi.dev/documentation#name": "Luke Skywalker" }],
      },
    },
  ])(
    "parses a context-defined $description",
    async ({ value, container, expandedValue }) => {
      const toParse = await makeToParse(
        { "http://example.com/thing": value },
        { "http://example.com/thing": { "@container": container } }
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
          intermediateResult: new IR.Object({
            "http://example.com/thing": new IR.Unwrapped(
              container,
              resource.intermediateResult
            ),
          }),
          operation: af.createJoin([
            addToRight(
              af.createBgp([
                af.createPattern(
                  variable,
                  df.namedNode("http://example.com/thing"),
                  resource.term
                ),
              ]),
              resource.operation
            ),
          ]),
          projections: resource.projections,
          warnings: resource.warnings.map(
            ({ message, path: [_containerKey, ...path] }) => ({
              message,
              path: ["http://example.com/thing", ...path],
            })
          ),
        })
      );
    }
  );

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
        intermediateResult: new IR.Object({
          film: new IR.Set(
            filmVariable,
            new IR.Object({
              title: new IR.NativePlaceholder(titleVariable),
            })
          ),
        }),
        operation: af.createJoin([
          af.createLeftJoin(
            af.createJoin([]),
            af.createJoin([
              af.createBgp([
                af.createPattern(
                  variable,
                  df.namedNode("http://swapi.dev/documentation#film"),
                  filmVariable
                ),
              ]),
              af.createBgp([
                af.createPattern(
                  filmVariable,
                  df.namedNode("http://swapi.dev/documentation#title"),
                  titleVariable
                ),
              ]),
            ])
          ),
        ]),
        projections: [filmVariable, titleVariable],
      })
    );
  });

  it("parses an @id entry with a value", async () => {
    const toParse = await makeToParse({
      "@id": "https://swapi.dev/api/people/1/",
      "http://swapi.dev/documentation#name": "Luke Skywalker",
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.Object({
          "@id": new IR.LiteralValue("https://swapi.dev/api/people/1/"),
          "http://swapi.dev/documentation#name": new IR.LiteralValue(
            "Luke Skywalker"
          ),
        }),
        operation: af.createJoin([
          af.createBgp([
            af.createPattern(
              df.namedNode("https://swapi.dev/api/people/1/"),
              df.namedNode("http://swapi.dev/documentation#name"),
              df.literal("Luke Skywalker")
            ),
          ]),
        ]),
      })
    );
  });

  it("parses an @id entry with a placeholder", async () => {
    const toParse = await makeToParse({
      "@id": "?",
      "http://swapi.dev/documentation#name": "Luke Skywalker",
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.Object({
          "@id": new IR.NamePlaceholder(
            variable,
            nullContext,
            IR.NamePlaceholder.Compaction.BASE
          ),
          "http://swapi.dev/documentation#name": new IR.LiteralValue(
            "Luke Skywalker"
          ),
        }),
        operation: af.createJoin([
          af.createBgp([
            af.createPattern(
              variable,
              df.namedNode("http://swapi.dev/documentation#name"),
              df.literal("Luke Skywalker")
            ),
          ]),
        ]),
        projections: [variable],
      })
    );
  });

  it("parses an @id entry (mapped term)", async () => {
    const toParse = await makeToParse({
      "@context": {
        url: "@id",
      },
      url: "https://swapi.dev/api/people/1/",
      "http://swapi.dev/documentation#name": "Luke Skywalker",
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.Object({
          "@context": new IR.LiteralValue({
            url: "@id",
          }),
          url: new IR.LiteralValue("https://swapi.dev/api/people/1/"),
          "http://swapi.dev/documentation#name": new IR.LiteralValue(
            "Luke Skywalker"
          ),
        }),
        operation: af.createJoin([
          af.createBgp([
            af.createPattern(
              df.namedNode("https://swapi.dev/api/people/1/"),
              df.namedNode("http://swapi.dev/documentation#name"),
              df.literal("Luke Skywalker")
            ),
          ]),
        ]),
      })
    );
  });

  it("parses an @type entry with a value", async () => {
    const toParse = await makeToParse({
      "@type": "http://swapi.dev/documentation#Person",
      "http://swapi.dev/documentation#name": "Luke Skywalker",
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.Object({
          "@type": new IR.LiteralValue("http://swapi.dev/documentation#Person"),
          "http://swapi.dev/documentation#name": new IR.LiteralValue(
            "Luke Skywalker"
          ),
        }),
        operation: af.createJoin([
          af.createBgp([
            af.createPattern(
              variable,
              type,
              df.namedNode("http://swapi.dev/documentation#Person")
            ),
          ]),
          af.createBgp([
            af.createPattern(
              variable,
              df.namedNode("http://swapi.dev/documentation#name"),
              df.literal("Luke Skywalker")
            ),
          ]),
        ]),
      })
    );
  });

  it("parses an @type entry with a placeholder", async () => {
    const toParse = await makeToParse({
      "@type": "?",
      "http://swapi.dev/documentation#name": "Luke Skywalker",
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.Object({
          "@type": new IR.NamePlaceholder(
            df.variable("thing·type"),
            nullContext,
            IR.NamePlaceholder.Compaction.VOCAB
          ),
          "http://swapi.dev/documentation#name": new IR.LiteralValue(
            "Luke Skywalker"
          ),
        }),
        operation: af.createJoin([
          af.createBgp([
            af.createPattern(variable, type, df.variable("thing·type")),
          ]),
          af.createBgp([
            af.createPattern(
              variable,
              df.namedNode("http://swapi.dev/documentation#name"),
              df.literal("Luke Skywalker")
            ),
          ]),
        ]),
        projections: [df.variable("thing·type")],
      })
    );
  });

  it("parses an @type entry (mapped term)", async () => {
    const toParse = await makeToParse({
      "@context": {
        kind: "@type",
      },
      kind: "http://swapi.dev/documentation#Person",
      "http://swapi.dev/documentation#name": "Luke Skywalker",
    });

    expect(await parser.NodeObject(toParse)).toStrictEqual(
      parsed({
        term: variable,
        intermediateResult: new IR.Object({
          "@context": new IR.LiteralValue({
            kind: "@type",
          }),
          kind: new IR.LiteralValue("http://swapi.dev/documentation#Person"),
          "http://swapi.dev/documentation#name": new IR.LiteralValue(
            "Luke Skywalker"
          ),
        }),
        operation: af.createJoin([
          af.createBgp([
            af.createPattern(
              variable,
              type,
              df.namedNode("http://swapi.dev/documentation#Person")
            ),
          ]),
          af.createBgp([
            af.createPattern(
              variable,
              df.namedNode("http://swapi.dev/documentation#name"),
              df.literal("Luke Skywalker")
            ),
          ]),
        ]),
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
        intermediateResult: new IR.Object({
          bogus: new IR.LiteralValue("abc123"),
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
