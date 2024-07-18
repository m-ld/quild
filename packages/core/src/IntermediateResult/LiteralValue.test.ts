import { BindingsFactory } from "@comunica/bindings-factory";
import { describe, it, expect } from "@jest/globals";

import { LiteralValue } from "./LiteralValue";
import { df } from "../common";

const bf = new BindingsFactory(df);

const name = df.variable("root·name");

describe(LiteralValue, () => {
  it("returns its result", () => {
    const ir = new LiteralValue("blue");

    expect(ir.result()).toBe("blue");
  });

  it("ignores additional solutions", () => {
    const ir = new LiteralValue("Luke Skywalker").addSolution(
      bf.bindings([[name, df.literal("Owen Lars")]])
    );

    expect(ir.result()).toBe("Luke Skywalker");
  });
});
