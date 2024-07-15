import { BindingsFactory } from "@comunica/bindings-factory";
import { describe, it, expect } from "@jest/globals";

import { IRObject } from "./IRObject";
import { NativePlaceholder } from "./NativePlaceholder";
import { Unwrapped } from "./Unwrapped";
import { df } from "../common";

const bf = new BindingsFactory(df);

const name = df.variable("name");

describe(Unwrapped, () => {
  it("unwraps the child's result", () => {
    const ir = new Unwrapped(
      "@someContainer",
      new IRObject({ "@someContainer": new NativePlaceholder(name) })
    ).addSolution(bf.bindings([[name, df.literal("Luke Skywalker")]]));

    expect(ir.result()).toStrictEqual("Luke Skywalker");
  });
});
