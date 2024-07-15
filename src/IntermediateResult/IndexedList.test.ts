import { BindingsFactory } from "@comunica/bindings-factory";
import { describe, it, expect } from "@jest/globals";

import * as IR from ".";
import { IndexedList } from "./IndexedList";
import { df, integer } from "../common";

const bf = new BindingsFactory(df);

const index = df.variable("index");
const name = df.variable("name");
const starship = df.variable("starship");
const starshipName = df.variable("starshipName");

describe(IndexedList, () => {
  it("puts its results in a @list", () => {
    const ir = new IndexedList(
      index,
      new IR.Object({
        name: new IR.NativePlaceholder(name),
        starships: new IR.Set(
          starship,
          new IR.Object({ name: new IR.NativePlaceholder(starshipName) })
        ),
      })
    )
      .addSolution(
        bf.bindings([
          [index, df.literal("0", integer)],
          [name, df.literal("Luke Skywalker")],
          [starship, df.namedNode("https://swapi.dev/api/starships/12/")],
          [starshipName, df.literal("X-wing")],
        ])
      )
      .addSolution(
        bf.bindings([
          [index, df.literal("0", integer)],
          [name, df.literal("Luke Skywalker")],
          [starship, df.namedNode("https://swapi.dev/api/starships/22/")],
          [starshipName, df.literal("Imperial shuttle")],
        ])
      )
      .addSolution(
        bf.bindings([
          [index, df.literal("1", integer)],
          [name, df.literal("Wedge Antilles")],
          [starship, df.namedNode("https://swapi.dev/api/starships/12/")],
          [starshipName, df.literal("X-wing")],
        ])
      );

    expect(ir.result()).toStrictEqual([
      {
        name: "Luke Skywalker",
        starships: [{ name: "X-wing" }, { name: "Imperial shuttle" }],
      },
      { name: "Wedge Antilles", starships: [{ name: "X-wing" }] },
    ]);
  });

  it("puts accepts solutions in any order", () => {
    const ir = new IndexedList(
      index,
      new IR.Object({
        name: new IR.NativePlaceholder(name),
        starships: new IR.Set(
          starship,
          new IR.Object({ name: new IR.NativePlaceholder(starshipName) })
        ),
      })
    )
      .addSolution(
        bf.bindings([
          [index, df.literal("0", integer)],
          [name, df.literal("Luke Skywalker")],
          [starship, df.namedNode("https://swapi.dev/api/starships/12/")],
          [starshipName, df.literal("X-wing")],
        ])
      )
      .addSolution(
        bf.bindings([
          [index, df.literal("1", integer)],
          [name, df.literal("Wedge Antilles")],
          [starship, df.namedNode("https://swapi.dev/api/starships/12/")],
          [starshipName, df.literal("X-wing")],
        ])
      )
      .addSolution(
        bf.bindings([
          [index, df.literal("0", integer)],
          [name, df.literal("Luke Skywalker")],
          [starship, df.namedNode("https://swapi.dev/api/starships/22/")],
          [starshipName, df.literal("Imperial shuttle")],
        ])
      );

    expect(ir.result()).toStrictEqual([
      {
        name: "Luke Skywalker",
        starships: [{ name: "X-wing" }, { name: "Imperial shuttle" }],
      },
      { name: "Wedge Antilles", starships: [{ name: "X-wing" }] },
    ]);
  });
});
