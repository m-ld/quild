import { BindingsFactory } from "@comunica/bindings-factory";
import { describe, it, expect } from "@jest/globals";

import { NativePlaceholder } from "./NativePlaceholder";
import { NodeObject } from "./NodeObject";
import { df, integer } from "../common";

const bf = new BindingsFactory(df);

const name = df.variable("root·name");
const height = df.variable("root·height");

describe(NodeObject, () => {
  it("distributes solutions", () => {
    const ir = new NodeObject({
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
