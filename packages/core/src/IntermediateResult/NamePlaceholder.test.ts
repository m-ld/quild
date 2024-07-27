import { BindingsFactory } from "@comunica/bindings-factory";
import { describe, it, expect } from "@jest/globals";

import { NamePlaceholder } from "./NamePlaceholder";
import { IncompleteResultError, NotANamedNodeError } from "./errors";
import { df } from "../common";
import { contextParser } from "../parse/common";

const bf = new BindingsFactory(df);

const root = df.variable("root");

describe(NamePlaceholder, () => {
  it("throws when it hasn't received a solution", () => {
    expect(async () => {
      new NamePlaceholder(
        root,
        await contextParser.parse({}),
        NamePlaceholder.Compaction.BASE
      ).result();
    }).rejects.toThrow(new IncompleteResultError(root));
  });

  it("accepts one solution", async () => {
    const ir = new NamePlaceholder(
      root,
      await contextParser.parse({}),
      NamePlaceholder.Compaction.BASE
    ).addSolution(
      bf.bindings([[root, df.namedNode("https://swapi.dev/api/films/1/")]])
    );

    expect(ir.result()).toBe("https://swapi.dev/api/films/1/");
  });

  it("compacts using the context, relative to the @base", async () => {
    const ir = new NamePlaceholder(
      root,
      await contextParser.parse({
        "@base": "https://swapi.dev/api/",
      }),
      NamePlaceholder.Compaction.BASE
    ).addSolution(
      bf.bindings([[root, df.namedNode("https://swapi.dev/api/films/1/")]])
    );

    expect(ir.result()).toBe("films/1/");
  });

  it("compacts using the context, relative to the @vocab", async () => {
    const ir = new NamePlaceholder(
      root,
      await contextParser.parse({
        "@vocab": "http://swapi.dev/documentation#",
      }),
      NamePlaceholder.Compaction.VOCAB
    ).addSolution(
      bf.bindings([[root, df.namedNode("http://swapi.dev/documentation#Film")]])
    );

    expect(ir.result()).toBe("Film");
  });

  it("ignores additional solutions", async () => {
    const ir = new NamePlaceholder(
      root,
      await contextParser.parse({}),
      NamePlaceholder.Compaction.BASE
    )
      .addSolution(
        bf.bindings([[root, df.namedNode("https://swapi.dev/api/films/1/")]])
      )
      .addSolution(
        bf.bindings([[root, df.namedNode("https://swapi.dev/api/films/2/")]])
      );

    expect(ir.result()).toBe("https://swapi.dev/api/films/1/");
  });

  it("throws trying to represent a non-name value", () => {
    expect(async () => {
      new NamePlaceholder(
        root,
        await contextParser.parse({}),
        NamePlaceholder.Compaction.BASE
      ).addSolution(bf.bindings([[root, df.literal("A New Hope")]]));
    }).rejects.toThrow(new NotANamedNodeError(df.literal("A New Hope")));
  });
});
