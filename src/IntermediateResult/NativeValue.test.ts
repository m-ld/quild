import { BindingsFactory } from "@comunica/bindings-factory";
import { describe, it, expect } from "@jest/globals";

import { NativeValue } from "./NativeValue";
import { df } from "../common";

const bf = new BindingsFactory(df);

const name = df.variable("root·name");

describe(NativeValue, () => {
  it("returns its result", () => {
    const ir = new NativeValue("blue");

    expect(ir.result()).toBe("blue");
  });

  it("ignores additional solutions", () => {
    const ir = new NativeValue("Luke Skywalker").addSolution(
      bf.bindings([[name, df.literal("Owen Lars")]])
    );

    expect(ir.result()).toBe("Luke Skywalker");
  });
});
