import { describe, it, expect } from "@jest/globals";

import value from "./index";

describe("the value", () => {
  it("should be 2", () => {
    expect(value).toBe(1);
  });
});
