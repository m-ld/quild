import { expectTypeOf } from "expect-type";

import { describe, it } from "./test-util/type-tests";

import type { QueryResult } from "./QueryResult";

declare function withPropertyTypes<PropertyTypes>(): {
  queryResult<Query>(
    this: void,
    query: Query
  ): Promise<QueryResult<Query, PropertyTypes>>;
};

const queryResult = withPropertyTypes<object>().queryResult;

interface PT {
  "http://swapi.dev/documentation#name": string;
  "http://swapi.dev/documentation#height": number;
  "http://swapi.dev/documentation#mass": number;
  "http://swapi.dev/documentation#title": string;
  "http://schema.org/description": string;
}

describe("QueryResult", () => {
  it("preserves literals", () => {
    expectTypeOf(
      queryResult({
        "http://swapi.dev/documentation#name": "Luke Skywalker",
      } as const)
    ).resolves.toEqualTypeOf<{
      "http://swapi.dev/documentation#name": "Luke Skywalker";
    }>();
  });

  it("fills in placeholders", () => {
    expectTypeOf(
      queryResult({
        "http://swapi.dev/documentation#name": "?",
      } as const)
    ).resolves.toEqualTypeOf<{
      "http://swapi.dev/documentation#name": unknown;
    }>();
  });

  it("uses known property types", () => {
    expectTypeOf(
      withPropertyTypes<PT>().queryResult({
        "http://swapi.dev/documentation#name": "?",
        "http://swapi.dev/documentation#height": "?",
      } as const)
    ).resolves.toEqualTypeOf<{
      "http://swapi.dev/documentation#name": string;
      "http://swapi.dev/documentation#height": number;
    }>();
  });

  it("expands Node Object Keys which are Terms", async () => {
    const query = {
      "@context": {
        name: "http://swapi.dev/documentation#name",
      },
      name: "?",
      height: "?",
    } as const;

    const result = await withPropertyTypes<PT>().queryResult(query);

    expectTypeOf<keyof typeof result>().toEqualTypeOf<
      "@context" | "name" | "height"
    >();
    expectTypeOf(result["@context"]).toEqualTypeOf<
      (typeof query)["@context"]
    >();
    expectTypeOf(result.name).toEqualTypeOf<string>();
    expectTypeOf(result.height).toEqualTypeOf<unknown>();
  });

  it("expands Node Object Keys which are Terms", async () => {
    const query = {
      "@context": {
        name: "http://swapi.dev/documentation#name",
      },
      name: "?",
      height: "?",
    } as const;

    const result = await withPropertyTypes<PT>().queryResult(query);

    expectTypeOf<keyof typeof result>().toEqualTypeOf<
      "@context" | "name" | "height"
    >();
    expectTypeOf(result["@context"]).toEqualTypeOf<
      (typeof query)["@context"]
    >();
    expectTypeOf(result.name).toEqualTypeOf<string>();
    expectTypeOf(result.height).toEqualTypeOf<unknown>();
  });

  it("expands Node Object Keys which are Compact IRIs", async () => {
    const query = {
      "@context": {
        swapi: "http://swapi.dev/documentation#",
      },
      "swapi:name": "?",
    } as const;

    const result = await withPropertyTypes<PT>().queryResult(query);

    expectTypeOf<keyof typeof result>().toEqualTypeOf<
      "@context" | "swapi:name"
    >();
    expectTypeOf(result["@context"]).toEqualTypeOf<
      (typeof query)["@context"]
    >();
    expectTypeOf(result["swapi:name"]).toEqualTypeOf<string>();
  });

  it("expands Node Object Keys which are vocab-mapped", async () => {
    const query = {
      "@context": {
        "@vocab": "http://swapi.dev/documentation#",
      },
      name: "?",
    } as const;

    const result = await withPropertyTypes<PT>().queryResult(query);

    expectTypeOf<keyof typeof result>().toEqualTypeOf<"@context" | "name">();
    expectTypeOf(result["@context"]).toEqualTypeOf<
      (typeof query)["@context"]
    >();
    expectTypeOf(result.name).toEqualTypeOf<string>();
  });

  it("accepts an array", async () => {
    const query = [
      {
        "@context": {
          "@vocab": "http://swapi.dev/documentation#",
        },
        name: "?",
      },
    ] as const;

    const result = await withPropertyTypes<PT>().queryResult(query);
    const first = result[0];

    if (!first) throw new Error("Expected a result");

    expectTypeOf<keyof typeof first>().toEqualTypeOf<"@context" | "name">();

    expectTypeOf(first["@context"]).toEqualTypeOf<
      (typeof query)[number]["@context"]
    >();
    expectTypeOf(first.name).toEqualTypeOf<string>();
  });

  it("accepts nested objects", async () => {
    const query = {
      "@context": {
        "@vocab": "http://swapi.dev/documentation#",
      },
      homeworld: {
        "@context": {
          schema: "http://schema.org/",
        },
        name: "?",
        "schema:description": "?",
      },
    } as const;

    const result = await withPropertyTypes<PT>().queryResult(query);

    expectTypeOf(result).toEqualTypeOf<{
      "@context": {
        readonly "@vocab": "http://swapi.dev/documentation#";
      };
      homeworld: {
        "@context": {
          readonly schema: "http://schema.org/";
        };
        name: string;
        "schema:description": string;
      };
    }>();
  });

  it("accepts nested objects and arrays", async () => {
    const query = {
      "@context": {
        "@vocab": "http://swapi.dev/documentation#",
      },
      films: [
        {
          "@context": {
            schema: "http://schema.org/",
          },
          title: "?",
          "schema:description": "?",
        },
      ],
    } as const;

    const result = await withPropertyTypes<PT>().queryResult(query);

    expectTypeOf(result).toEqualTypeOf<{
      "@context": {
        readonly "@vocab": "http://swapi.dev/documentation#";
      };
      films: Array<{
        "@context": {
          readonly schema: "http://schema.org/";
        };
        title: string;
        "schema:description": string;
      }>;
    }>();
  });

  it.todo("handle term definitions in @context that aren't strings");
  it.todo("handle more advanced @context propagation cases");
});
