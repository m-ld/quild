import { BindingsFactory } from "@comunica/bindings-factory";
import { describe, it, expect } from "@jest/globals";

import { IRObject } from "./IRObject";
import { IRSet } from "./IRSet";
import { NativePlaceholder } from "./NativePlaceholder";
import { df, integer } from "../common";

import type { IntermediateResult } from "./types";
import type { Term, Variable } from "@rdfjs/types";

const bf = new BindingsFactory(df);

const root = df.variable("root");
const name = df.variable("root·name");
const height = df.variable("root·height");
const films = df.variable("root·films");
const filmsTitle = df.variable("root·films·title");

describe(IRSet, () => {
  describe(`of a ${NativePlaceholder.name}`, () => {
    it("puts its results in an array", () => {
      const ir = new IRSet(
        filmsTitle,
        new NativePlaceholder(filmsTitle)
      ).addSolution(bf.bindings([[filmsTitle, df.literal("A New Hope")]]));

      expect(ir.result()).toStrictEqual(["A New Hope"]);
    });

    it("accepts multiple solutions", () => {
      const ir = new IRSet(filmsTitle, new NativePlaceholder(filmsTitle))
        .addSolution(bf.bindings([[filmsTitle, df.literal("A New Hope")]]))
        .addSolution(
          bf.bindings([[filmsTitle, df.literal("The Empire Strikes Back")]])
        );

      expect(ir.result()).toStrictEqual([
        "A New Hope",
        "The Empire Strikes Back",
      ]);
    });
  });

  describe(`of a ${IRObject.name}`, () => {
    it("puts its results in an array", () => {
      const ir = new IRSet(
        root,
        new IRObject({
          name: new NativePlaceholder(name),
          height: new NativePlaceholder(height),
        })
      ).addSolution(
        bf.bindings([
          [root, df.namedNode("https://swapi.dev/api/people/1/")],
          [name, df.literal("Luke Skywalker")],
          [height, df.literal("172", integer)],
        ])
      );

      expect(ir.result()).toStrictEqual([
        {
          name: "Luke Skywalker",
          height: 172,
        },
      ]);
    });

    it("accepts multiple solutions", () => {
      const ir = new IRSet(
        root,
        new IRObject({
          name: new NativePlaceholder(name),
          height: new NativePlaceholder(height),
        })
      )
        .addSolution(
          bf.bindings([
            [root, df.namedNode("https://swapi.dev/api/people/1/")],
            [name, df.literal("Luke Skywalker")],
            [height, df.literal("172", integer)],
          ])
        )
        .addSolution(
          bf.bindings([
            [root, df.namedNode("https://swapi.dev/api/people/6/")],
            [name, df.literal("Owen Lars")],
            [height, df.literal("178", integer)],
          ])
        );

      expect(ir.result()).toStrictEqual([
        {
          name: "Luke Skywalker",
          height: 172,
        },
        {
          name: "Owen Lars",
          height: 178,
        },
      ]);
    });

    it("nests properly", () => {
      const initialIr = new IRSet(
        root,
        new IRObject({
          name: new NativePlaceholder(name),
          films: new IRSet(
            films,
            new IRObject({ title: new NativePlaceholder(filmsTitle) })
          ),
        })
      );

      const solutions: Array<Array<[Variable, Term]>> = [
        [
          [root, df.namedNode("https://swapi.dev/api/people/1/")],
          [name, df.literal("Luke Skywalker")],
          [films, df.namedNode("https://swapi.dev/api/films/1/")],
          [filmsTitle, df.literal("A New Hope")],
        ],
        [
          [root, df.namedNode("https://swapi.dev/api/people/1/")],
          [name, df.literal("Luke Skywalker")],
          [films, df.namedNode("https://swapi.dev/api/films/2/")],
          [filmsTitle, df.literal("The Empire Strikes Back")],
        ],
        [
          [root, df.namedNode("https://swapi.dev/api/people/1/")],
          [name, df.literal("Luke Skywalker")],
          [films, df.namedNode("https://swapi.dev/api/films/3/")],
          [filmsTitle, df.literal("Return of the Jedi")],
        ],
        [
          [root, df.namedNode("https://swapi.dev/api/people/1/")],
          [name, df.literal("Luke Skywalker")],
          [films, df.namedNode("https://swapi.dev/api/films/6/")],
          [filmsTitle, df.literal("Revenge of the Sith")],
        ],
        [
          [root, df.namedNode("https://swapi.dev/api/people/6/")],
          [name, df.literal("Owen Lars")],
          [films, df.namedNode("https://swapi.dev/api/films/1/")],
          [filmsTitle, df.literal("A New Hope")],
        ],
        [
          [root, df.namedNode("https://swapi.dev/api/people/6/")],
          [name, df.literal("Owen Lars")],
          [films, df.namedNode("https://swapi.dev/api/films/5/")],
          [filmsTitle, df.literal("Attack of the Clones")],
        ],
        [
          [root, df.namedNode("https://swapi.dev/api/people/6/")],
          [name, df.literal("Owen Lars")],
          [films, df.namedNode("https://swapi.dev/api/films/6/")],
          [filmsTitle, df.literal("Revenge of the Sith")],
        ],
      ];

      // Add all of the solutions
      const ir = solutions.reduce<IntermediateResult>(
        (partialIr, solution) => partialIr.addSolution(bf.bindings(solution)),
        initialIr
      );

      expect(ir.result()).toStrictEqual([
        {
          name: "Luke Skywalker",
          films: [
            { title: "A New Hope" },
            { title: "The Empire Strikes Back" },
            { title: "Return of the Jedi" },
            { title: "Revenge of the Sith" },
          ],
        },
        {
          name: "Owen Lars",
          films: [
            { title: "A New Hope" },
            { title: "Attack of the Clones" },
            { title: "Revenge of the Sith" },
          ],
        },
      ]);
    });
  });
});
