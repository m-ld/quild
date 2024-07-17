import { describe, it, expect } from "@jest/globals";

import { linearizeList, type LinkedListObject } from "./linearizeList";

describe("linearizeList", () => {
  it("should linearize a linked list as an Iterable", () => {
    const links: LinkedListObject<number> = {
      one: { value: 10, next: "two" },
      two: { value: 20, next: "three" },
      three: { value: 30, next: "four" },
      four: { value: 40, next: null },
    };

    expect([...linearizeList("one", links)]).toEqual([10, 20, 30, 40]);
  });

  it("should throw an error if a link is missing in the list", () => {
    const links: LinkedListObject<number> = {
      one: { value: 10, next: "two" },
      // Missing link for "two"
      three: { value: 30, next: "four" },
      four: { value: 40, next: null },
    };

    expect(() => [...linearizeList("one", links)]).toThrow(
      "Missing link for two"
    );
  });
});
