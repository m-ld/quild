import { BindingsFactory } from "@comunica/bindings-factory";
import { describe, it, expect } from "@jest/globals";

import { IRObject } from "./IRObject";
import { NativePlaceholder } from "./NativePlaceholder";
import { df, integer } from "../common";

const bf = new BindingsFactory(df);

const name = df.variable("root·name");
const height = df.variable("root·height");

describe(IRObject, () => {
  it("distributes solutions", () => {
    const ir = new IRObject({
      name: new NativePlaceholder(name),
      height: new NativePlaceholder(height),
    }).addSolution(
      bf.bindings([
        [name, df.literal("Luke Skywalker")],
        [height, df.literal("172", integer)],
      ])
    );

    expect(ir.result()).toStrictEqual({
      name: "Luke Skywalker",
      height: 172,
    });
  });
});
