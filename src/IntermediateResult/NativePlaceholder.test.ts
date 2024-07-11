import { BindingsFactory } from "@comunica/bindings-factory";
import { describe, it, expect } from "@jest/globals";

import { NativePlaceholder } from "./NativePlaceholder";
import { BadNativeValueError, IncompleteResultError } from "./errors";
import { df } from "../common";

const bf = new BindingsFactory(df);

const filmsTitle = df.variable("root·films·title");

describe(NativePlaceholder, () => {
  it("throws when it hasn't received a solution", () => {
    expect(() => {
      new NativePlaceholder(filmsTitle).result();
    }).toThrow(new IncompleteResultError(filmsTitle));
  });

  it("accepts one solution", () => {
    const ir = new NativePlaceholder(filmsTitle).addSolution(
      bf.bindings([[filmsTitle, df.literal("A New Hope")]])
    );

    expect(ir.result()).toBe("A New Hope");
  });

  it("ignores additional solutions", () => {
    const ir = new NativePlaceholder(filmsTitle)
      .addSolution(bf.bindings([[filmsTitle, df.literal("A New Hope")]]))
      .addSolution(
        bf.bindings([[filmsTitle, df.literal("The Empire Strikes Back")]])
      );

    expect(ir.result()).toBe("A New Hope");
  });

  it("throws trying to represent a non-scalar value", () => {
    expect(() => {
      new NativePlaceholder(filmsTitle).addSolution(
        bf.bindings([
          [filmsTitle, df.namedNode("https://swapi.dev/api/films/1/")],
        ])
      );
    }).toThrow(
      new BadNativeValueError(df.namedNode("https://swapi.dev/api/films/1/"))
    );
  });
});
