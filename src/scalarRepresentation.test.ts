import { describe, it, expect } from "@jest/globals";
import { DataFactory } from "rdf-data-factory";

import { boolean, double, integer } from "./common";
import { scalarRepresentation } from "./scalarRepresentation";

const df = new DataFactory();

describe("scalar", () => {
  it("provides a scalar representation of a simple string", () => {
    expect(scalarRepresentation(df.literal("Luke Skywalker"))).toBe(
      "Luke Skywalker"
    );
  });

  it("provides a scalar representation of an integer", () => {
    expect(scalarRepresentation(df.literal("172", integer))).toBe(172);
  });

  it("provides a scalar representation of a double", () => {
    expect(scalarRepresentation(df.literal("172.123", double))).toBe(172.123);
  });

  it("provides a scalar representation of a boolean", () => {
    expect(scalarRepresentation(df.literal("true", boolean))).toBe(true);
  });
});
