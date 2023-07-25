import { describe, it, expect } from "@jest/globals";
import { DataFactory } from "rdf-data-factory";

import { boolean, double, integer } from "./common";
import nativeRepresentation from "./nativeRepresentation";

const df = new DataFactory();

describe(nativeRepresentation, () => {
  it("provides a scalar representation of a simple string", () => {
    expect(nativeRepresentation(df.literal("Luke Skywalker"))).toBe(
      "Luke Skywalker"
    );
  });

  it("provides a scalar representation of an integer", () => {
    expect(nativeRepresentation(df.literal("172", integer))).toBe(172);
  });

  it("provides a scalar representation of a double", () => {
    expect(nativeRepresentation(df.literal("172.123", double))).toBe(172.123);
  });

  it("provides a scalar representation of a boolean", () => {
    expect(nativeRepresentation(df.literal("true", boolean))).toBe(true);
  });
});
