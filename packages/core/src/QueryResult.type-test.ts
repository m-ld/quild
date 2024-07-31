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
});
