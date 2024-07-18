import { BindingsFactory } from "@comunica/bindings-factory";
import { describe, it, expect } from "@jest/globals";

import * as IR from ".";
import { LinkedList } from "./LinkedList";
import { df, nil } from "../common";

const bf = new BindingsFactory(df);

const list = df.variable("list");
const slot = df.variable("slot");
const rest = df.variable("rest");
const name = df.variable("name");
const starship = df.variable("starship");
const starshipName = df.variable("starshipName");

const slot1 = df.blankNode("slot1");
const slot2 = df.blankNode("slot2");

describe(LinkedList, () => {
  it("puts its results in an array", () => {
    const ir = new LinkedList(
      list,
      slot,
      rest,
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
          [list, slot1],
          [slot, slot1],
          [rest, slot2],
          [name, df.literal("Luke Skywalker")],
          [starship, df.namedNode("https://swapi.dev/api/starships/12/")],
          [starshipName, df.literal("X-wing")],
        ])
      )
      .addSolution(
        bf.bindings([
          [list, slot1],
          [slot, slot1],
          [rest, slot2],
          [name, df.literal("Luke Skywalker")],
          [starship, df.namedNode("https://swapi.dev/api/starships/22/")],
          [starshipName, df.literal("Imperial shuttle")],
        ])
      )
      .addSolution(
        bf.bindings([
          [list, slot1],
          [slot, slot2],
          [rest, nil],
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
    const ir = new LinkedList(
      list,
      slot,
      rest,
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
          [list, slot1],
          [slot, slot1],
          [rest, slot2],
          [name, df.literal("Luke Skywalker")],
          [starship, df.namedNode("https://swapi.dev/api/starships/12/")],
          [starshipName, df.literal("X-wing")],
        ])
      )
      .addSolution(
        bf.bindings([
          [list, slot1],
          [slot, slot2],
          [rest, nil],
          [name, df.literal("Wedge Antilles")],
          [starship, df.namedNode("https://swapi.dev/api/starships/12/")],
          [starshipName, df.literal("X-wing")],
        ])
      )
      .addSolution(
        bf.bindings([
          [list, slot1],
          [slot, slot1],
          [rest, slot2],
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
