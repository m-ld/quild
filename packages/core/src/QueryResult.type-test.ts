import { expectTypeOf } from "expect-type";

import { describe, it } from "./test-util/type-tests";

import type { QueryResult } from "./QueryResult";
import type { ReadonlyDeep } from "type-fest";

declare function withPropertyTypes<PropertyTypes>(): {
  queryResult<Query>(
    this: void,
    query: Query
  ): Promise<QueryResult<Query, PropertyTypes>>;
};

const queryResult = withPropertyTypes<object>().queryResult;

describe("QueryResult", () => {
  it("preserves literals", () => {
    expectTypeOf(
      queryResult({
        "http://swapi.dev/documentation#name": "Luke Skywalker",
      } as const)
    ).resolves.toEqualTypeOf<
      ReadonlyDeep<{
        "http://swapi.dev/documentation#name": "Luke Skywalker";
      }>
    >();
  });

  it("fills in placeholders", () => {
    expectTypeOf(
      queryResult({
        "http://swapi.dev/documentation#name": "?",
      } as const)
    ).resolves.toEqualTypeOf<
      ReadonlyDeep<{
        "http://swapi.dev/documentation#name": unknown;
      }>
    >();
  });

  it("uses known property types", () => {
    expectTypeOf(
      withPropertyTypes<{
        "http://swapi.dev/documentation#name": string;
        "http://swapi.dev/documentation#height": number;
        "http://swapi.dev/documentation#mass": number;
      }>().queryResult({
        "http://swapi.dev/documentation#name": "?",
        "http://swapi.dev/documentation#height": "?",
      } as const)
    ).resolves.toEqualTypeOf<
      ReadonlyDeep<{
        "http://swapi.dev/documentation#name": string;
        "http://swapi.dev/documentation#height": number;
      }>
    >();
  });

  it("expands Node Object Keys which are Terms", async () => {
    const result = await withPropertyTypes<{
      "http://swapi.dev/documentation#name": string;
      "http://swapi.dev/documentation#height": number;
    }>().queryResult({
      "@context": {
        name: "http://swapi.dev/documentation#name",
      },
      name: "?",
      height: "?",
    } as const);

    expectTypeOf<keyof typeof result>().toEqualTypeOf<
      "@context" | "name" | "height"
    >();
    expectTypeOf(result["@context"]).toEqualTypeOf<
      ReadonlyDeep<{
        name: "http://swapi.dev/documentation#name";
      }>
    >();
    expectTypeOf(result.name).toEqualTypeOf<string>();
    expectTypeOf(result.height).toEqualTypeOf<unknown>();
  });
});
