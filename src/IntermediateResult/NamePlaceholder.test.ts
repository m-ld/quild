import { BindingsFactory } from "@comunica/bindings-factory";
import { describe, it, expect } from "@jest/globals";

import { NamePlaceholder } from "./NamePlaceholder";
import { IncompleteResultError, NotANamedNodeError } from "./errors";
import { df } from "../common";

const bf = new BindingsFactory(df);

const root = df.variable("root");

describe(NamePlaceholder, () => {
  it("throws when it hasn't received a solution", () => {
    expect(() => {
      new NamePlaceholder(root).result();
    }).toThrow(new IncompleteResultError(root));
  });

  it("accepts one solution", () => {
    const ir = new NamePlaceholder(root).addSolution(
      bf.bindings([[root, df.namedNode("https://swapi.dev/api/films/1/")]])
    );

    expect(ir.result()).toBe("https://swapi.dev/api/films/1/");
  });

  it("ignores additional solutions", () => {
    const ir = new NamePlaceholder(root)
      .addSolution(
        bf.bindings([[root, df.namedNode("https://swapi.dev/api/films/1/")]])
      )
      .addSolution(
        bf.bindings([[root, df.namedNode("https://swapi.dev/api/films/2/")]])
      );

    expect(ir.result()).toBe("https://swapi.dev/api/films/1/");
  });

  it("throws trying to represent a non-name value", () => {
    expect(() => {
      new NamePlaceholder(root).addSolution(
        bf.bindings([[root, df.literal("A New Hope")]])
      );
    }).toThrow(new NotANamedNodeError(df.literal("A New Hope")));
  });
});
