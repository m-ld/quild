import { BindingsFactory } from "@comunica/bindings-factory";
import { describe, it, expect } from "@jest/globals";

import {
  NativePlaceholder,
  Plural,
  NodeObject,
  type IntermediateResult,
  IncompleteResultError,
  NativeValue,
  BadNativeValueError,
  NamePlaceholder,
  NotANamedNodeError,
} from "./IntermediateResult";
import { df, integer } from "./common";

import type { Term, Variable } from "@rdfjs/types";

const bf = new BindingsFactory(df);

const root = df.variable("root");
const name = df.variable("root·name");
const height = df.variable("root·height");
const films = df.variable("root·films");
const filmsTitle = df.variable("root·films·title");

describe(NativePlaceholder, () => {
  it("throws when it hasn't received a solution", () => {
    expect(() => {
      new NativePlaceholder(filmsTitle).result();
    }).toThrow(new IncompleteResultError(filmsTitle));
  });

  it("accepts one solution", () => {
    const ir = new NativePlaceholder(filmsTitle).addSolution(
      bf.bindings([[filmsTitle, df.literal("A New Hope")]])
    );

    expect(ir.result()).toBe("A New Hope");
  });

  it("ignores additional solutions", () => {
    const ir = new NativePlaceholder(filmsTitle)
      .addSolution(bf.bindings([[filmsTitle, df.literal("A New Hope")]]))
      .addSolution(
        bf.bindings([[filmsTitle, df.literal("The Empire Strikes Back")]])
      );

    expect(ir.result()).toBe("A New Hope");
  });

  it("throws trying to represent a non-scalar value", () => {
    expect(() => {
      new NativePlaceholder(filmsTitle).addSolution(
        bf.bindings([
          [filmsTitle, df.namedNode("https://swapi.dev/api/films/1/")],
        ])
      );
    }).toThrow(
      new BadNativeValueError(df.namedNode("https://swapi.dev/api/films/1/"))
    );
  });
});

describe(NamePlaceholder, () => {
  it("throws when it hasn't received a solution", () => {
    expect(() => {
      new NamePlaceholder(root).result();
    }).toThrow(new IncompleteResultError(root));
  });

  it("accepts one solution", () => {
    const ir = new NamePlaceholder(root).addSolution(
      bf.bindings([[root, df.namedNode("https://swapi.dev/api/films/1/")]])
    );

    expect(ir.result()).toBe("https://swapi.dev/api/films/1/");
  });

  it("ignores additional solutions", () => {
    const ir = new NamePlaceholder(root)
      .addSolution(
        bf.bindings([[root, df.namedNode("https://swapi.dev/api/films/1/")]])
      )
      .addSolution(
        bf.bindings([[root, df.namedNode("https://swapi.dev/api/films/2/")]])
      );

    expect(ir.result()).toBe("https://swapi.dev/api/films/1/");
  });

  it("throws trying to represent a non-name value", () => {
    expect(() => {
      new NamePlaceholder(root).addSolution(
        bf.bindings([[root, df.literal("A New Hope")]])
      );
    }).toThrow(new NotANamedNodeError(df.literal("A New Hope")));
  });
});

describe(NativeValue, () => {
  it("returns its result", () => {
    const ir = new NativeValue("blue");

    expect(ir.result()).toBe("blue");
  });

  it("ignores additional solutions", () => {
    const ir = new NativeValue("Luke Skywalker").addSolution(
      bf.bindings([[name, df.literal("Owen Lars")]])
    );

    expect(ir.result()).toBe("Luke Skywalker");
  });
});

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

describe(Plural, () => {
  describe(`of a ${NativePlaceholder.name}`, () => {
    it("puts its results in an array", () => {
      const ir = new Plural(
        filmsTitle,
        new NativePlaceholder(filmsTitle)
      ).addSolution(bf.bindings([[filmsTitle, df.literal("A New Hope")]]));

      expect(ir.result()).toStrictEqual(["A New Hope"]);
    });

    it("accepts multiple solutions", () => {
      const ir = new Plural(filmsTitle, new NativePlaceholder(filmsTitle))
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

  describe(`of a ${NodeObject.name}`, () => {
    it("puts its results in an array", () => {
      const ir = new Plural(
        root,
        new NodeObject({
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
      const ir = new Plural(
        root,
        new NodeObject({
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
      const initialIr = new Plural(
        root,
        new NodeObject({
          name: new NativePlaceholder(name),
          films: new Plural(
            films,
            new NodeObject({ title: new NativePlaceholder(filmsTitle) })
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
