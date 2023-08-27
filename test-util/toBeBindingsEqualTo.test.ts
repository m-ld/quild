import { QueryEngine } from "@comunica/query-sparql-rdfjs";
import { describe, expect, it } from "@jest/globals";
import { Store } from "n3";
import { DataFactory } from "rdf-data-factory";

import { runMatcher } from "./runMatcher";
import { readAll } from "../src/readAll";

import type { ExpectedBindings } from "./toBeBindingsEqualTo";
import type { Quad } from "@rdfjs/types";

async function query(query: string, quads?: Quad[]) {
  const engine = new QueryEngine();

  const bindingsStream = await engine.queryBindings(query, {
    sources: [new Store(quads)],
  });

  const bindings = await readAll(bindingsStream);
  return bindings;
}

const run = runMatcher(expect, "toBeBindingsEqualTo");

describe("toBeBindingsEqualTo", () => {
  it("matches when the expected matches", async () => {
    const actual = await query(/* sparql */ `
    SELECT ?a ?b ?c
    WHERE {
      VALUES (?a ?b ?c) {
        ("1" "2" "3")
        ("4" "5" "6")
      }
    }
  `);

    const expected = [
      ["a", "b", "c"],
      [`"1"`, `"2"`, `"3"`],
      [`"4"`, `"5"`, `"6"`],
    ];

    expect(run(actual, expected)).toMatchInlineSnapshot(`"<Pass>"`);
  });

  it("matches in any order, in either dimension", async () => {
    const actual = await query(/* sparql */ `
    SELECT ?a ?b ?c
    WHERE {
      VALUES (?a ?b ?c) {
        ("1" "2" "3")
        ("4" "5" "6")
      }
    }
  `);

    const expected = [
      ["c", "a", "b"],
      [`"6"`, `"4"`, `"5"`],
      [`"3"`, `"1"`, `"2"`],
    ];

    expect(run(actual, expected)).toMatchInlineSnapshot(`"<Pass>"`);
  });

  it("shows a diff when it doesn't match", async () => {
    const actual = await query(/* sparql */ `
    SELECT ?a ?b ?c
    WHERE {
      VALUES (?a ?b ?c) {
        ("1" "2" "3")
        ("4" "5" "6")
      }
    }
  `);

    const expected = [
      ["a", "b", "c"],
      [`"1"`, `"2"`, `"4"`],
      [`"4"`, `"5"`, `"6"`],
    ];

    expect(run(actual, expected)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

- Expected  - 1
+ Received  + 1

  2 bindings:
  ╔═════╤═════╤═════╗
  ║ a   │ b   │ c   ║
  ╟─────┼─────┼─────╢
- ║ "1" │ "2" │ "4" ║
+ ║ "1" │ "2" │ "3" ║
  ╟─────┼─────┼─────╢
  ║ "4" │ "5" │ "6" ║
  ╚═════╧═════╧═════╝
  ↵"
`);
  });

  it("uses the variable ordering given in the expected values", async () => {
    const actual = await query(/* sparql */ `
    SELECT ?a ?b ?c ?d
    WHERE {
      VALUES (?a ?b ?c ?d) {
        ("1" "2" "3" "7")
        ("4" "5" "6" "8")
      }
    }
  `);

    const expected = [
      ["c", "a", "b"],
      [`"4"`, `"1"`, `"2"`],
      [`"6"`, `"4"`, `"5"`],
    ];

    expect(run(actual, expected)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

- Expected  - 2
+ Received  + 2

  2 bindings:
  ╔═════╤═════╤═════╤═════╗
  ║ c   │ a   │ b   │ d   ║
  ╟─────┼─────┼─────┼─────╢
- ║ "4" │ "1" │ "2" │     ║
+ ║ "3" │ "1" │ "2" │ "7" ║
  ╟─────┼─────┼─────┼─────╢
- ║ "6" │ "4" │ "5" │     ║
+ ║ "6" │ "4" │ "5" │ "8" ║
  ╚═════╧═════╧═════╧═════╝
  ↵"
`);
  });

  it("sorts the rows", async () => {
    const actual = await query(/* sparql */ `
    SELECT ?a ?b ?c
    WHERE {
      VALUES (?a ?b ?c) {
        ("1" "2" "3")
        ("4" "5" "6")
        ("7" "8" "9")
      }
    }
  `);

    const expected = [
      ["a", "b", "c"],
      [`"1"`, `"2"`, `"3"`],
      [`"7"`, `"8"`, `"9"`],
      [`"4"`, `"5"`, `"0"`],
    ];

    expect(run(actual, expected)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

- Expected  - 1
+ Received  + 1

@@ -2,10 +2,10 @@
  ╔═════╤═════╤═════╗
  ║ a   │ b   │ c   ║
  ╟─────┼─────┼─────╢
  ║ "1" │ "2" │ "3" ║
  ╟─────┼─────┼─────╢
- ║ "4" │ "5" │ "0" ║
+ ║ "4" │ "5" │ "6" ║
  ╟─────┼─────┼─────╢
  ║ "7" │ "8" │ "9" ║
  ╚═════╧═════╧═════╝
  ↵"
`);
  });

  it("displays empty cells when needed", async () => {
    const actual = await query(/* sparql */ `
    SELECT ?a ?b ?d
    WHERE {
      VALUES (?a ?b ?d) {
        ("1" "2" UNDEF)
        ("4" "5" "6")
        ("7" "8" "9")
      }
    }
  `);

    const expected: ExpectedBindings = [
      ["a", "b", "c"],
      [`"1"`, `"2"`, `"3"`],
      [`"7"`, `"8"`, `"9"`],
      [`"4"`, `"5"`, undefined],
    ];

    expect(run(actual, expected)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

- Expected  - 3
+ Received  + 3

  3 bindings:
  ╔═════╤═════╤═════╤═════╗
  ║ a   │ b   │ c   │ d   ║
  ╟─────┼─────┼─────┼─────╢
- ║ "1" │ "2" │ "3" │     ║
+ ║ "1" │ "2" │     │     ║
  ╟─────┼─────┼─────┼─────╢
- ║ "4" │ "5" │     │     ║
+ ║ "4" │ "5" │     │ "6" ║
  ╟─────┼─────┼─────┼─────╢
- ║ "7" │ "8" │ "9" │     ║
+ ║ "7" │ "8" │     │ "9" ║
  ╚═════╧═════╧═════╧═════╝
  ↵"
`);
  });

  it("matches column widths to keep the diff nice", async () => {
    const actual = await query(/* sparql */ `
    SELECT ?a ?b ?c
    WHERE {
      VALUES (?a ?b ?c) {
        ("11" "2" "3")
        ("4" "5" "6")
      }
    }
  `);

    const expected = [
      ["c", "a", "b"],
      [`"44"`, `"1"`, `"2"`],
      [`"6"`, `"4"`, `"5"`],
    ];

    expect(run(actual, expected)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

- Expected  - 1
+ Received  + 1

  2 bindings:
  ╔══════╤══════╤═════╗
  ║ c    │ a    │ b   ║
  ╟──────┼──────┼─────╢
- ║ "44" │ "1"  │ "2" ║
+ ║ "3"  │ "11" │ "2" ║
  ╟──────┼──────┼─────╢
  ║ "6"  │ "4"  │ "5" ║
  ╚══════╧══════╧═════╝
  ↵"
`);
  });

  it("matches on blank nodes", async () => {
    const df = new DataFactory();

    const holmes = df.blankNode("holmes");
    const watson = df.blankNode("watson");
    const data = [
      df.quad(
        holmes,
        df.namedNode("http://schema.org/givenName"),
        df.literal("Sherlock")
      ),
      df.quad(
        holmes,
        df.namedNode("http://schema.org/familyName"),
        df.literal("Holmes")
      ),
      df.quad(
        watson,
        df.namedNode("http://schema.org/givenName"),
        df.literal("John")
      ),
      df.quad(
        watson,
        df.namedNode("http://schema.org/familyName"),
        df.literal("Watson")
      ),
    ];

    const actual = await query(
      /* sparql */ `
    SELECT ?person ?givenName ?familyName
    WHERE {
      ?person <http://schema.org/givenName> ?givenName .
      ?person <http://schema.org/familyName> ?familyName .
    }
  `,
      data
    );

    const correct = [
      ["person", "givenName", "familyName"],
      ["_:x", `"Sherlock"`, `"Holmes"`],
      ["_:y", `"John"`, `"Watson"`],
    ];

    const sameBlankNode = [
      ["person", "givenName", "familyName"],
      ["_:x", `"Sherlock"`, `"Holmes"`],
      ["_:x", `"John"`, `"Watson"`],
    ];

    const badValues = [
      ["person", "givenName", "familyName"],
      ["_:x", `"Sherlock"`, `"Watson"`],
      ["_:y", `"John"`, `"Holmes"`],
    ];

    expect(run(actual, correct)).toMatchInlineSnapshot(`"<Pass>"`);

    expect(run(actual, sameBlankNode)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

- Expected  - 2
+ Received  + 2

  2 bindings:
  ╔═══════════════╤════════════╤════════════╗
  ║ person        │ givenName  │ familyName ║
  ╟───────────────┼────────────┼────────────╢
- ║ _:x           │ "John"     │ "Watson"   ║
+ ║ _:bc_0_holmes │ "Sherlock" │ "Holmes"   ║
  ╟───────────────┼────────────┼────────────╢
- ║ _:x           │ "Sherlock" │ "Holmes"   ║
+ ║ _:bc_0_watson │ "John"     │ "Watson"   ║
  ╚═══════════════╧════════════╧════════════╝
  ↵"
`);

    expect(run(actual, badValues)).toMatchInlineSnapshot(`
"expect(received).toBe(expected) // Object.is equality

- Expected  - 2
+ Received  + 2

  2 bindings:
  ╔═══════════════╤════════════╤════════════╗
  ║ person        │ givenName  │ familyName ║
  ╟───────────────┼────────────┼────────────╢
- ║ _:x           │ "Sherlock" │ "Watson"   ║
+ ║ _:bc_0_holmes │ "Sherlock" │ "Holmes"   ║
  ╟───────────────┼────────────┼────────────╢
- ║ _:y           │ "John"     │ "Holmes"   ║
+ ║ _:bc_0_watson │ "John"     │ "Watson"   ║
  ╚═══════════════╧════════════╧════════════╝
  ↵"
`);
  });
});
