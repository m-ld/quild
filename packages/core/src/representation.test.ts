import { describe, it, expect } from "@jest/globals";
import { DataFactory } from "rdf-data-factory";

import { boolean, double, integer } from "./common";
import { toJSONNative, toRdfLiteral } from "./representation";

const df = new DataFactory();

describe(toJSONNative, () => {
  it("provides a scalar representation of a simple string", () => {
    expect(toJSONNative(df.literal("Luke Skywalker"))).toBe("Luke Skywalker");
  });

  it("provides a scalar representation of an integer", () => {
    expect(toJSONNative(df.literal("172", integer))).toBe(172);
  });

  it("provides a scalar representation of a double", () => {
    expect(toJSONNative(df.literal("172.123", double))).toBe(172.123);
  });

  it("provides a scalar representation of a boolean", () => {
    expect(toJSONNative(df.literal("true", boolean))).toBe(true);
  });
});

describe(toRdfLiteral, () => {
  it("provides a scalar representation of a simple string", () => {
    expect(toRdfLiteral("Luke Skywalker")).toStrictEqual(
      df.literal("Luke Skywalker")
    );
  });

  it("provides a scalar representation of an integer", () => {
    expect(toRdfLiteral(172)).toStrictEqual(df.literal("172", integer));
  });

  it("provides a scalar representation of a double", () => {
    expect(toRdfLiteral(172.123)).toStrictEqual(df.literal("172.123", double));
  });

  it("provides a scalar representation of a boolean", () => {
    expect(toRdfLiteral(true)).toStrictEqual(df.literal("true", boolean));
  });
});
