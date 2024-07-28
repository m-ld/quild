declare module "expect/build/matchers" {
  import type {
    Matchers,
    MatcherFunction,
    SyncExpectationResult,
  } from "expect";

  /**
   * Given the type of a matcher (as defined in the `Matcher` interface and
   * called in an `expect()` statement), returns the type of the original
   * `MatcherFunction` presumably used to create that matcher by extending
   * `expect`.
   */
  type MatcherFunctionDefiningMatcher<
    Matcher extends (...args: never[]) => unknown,
  > = MatcherFunction<Parameters<Matcher>>;

  type BuiltInMatcherName =
    | "toBe"
    | "toBeCloseTo"
    | "toBeDefined"
    | "toBeFalsy"
    | "toBeGreaterThan"
    | "toBeGreaterThanOrEqual"
    | "toBeInstanceOf"
    | "toBeLessThan"
    | "toBeLessThanOrEqual"
    | "toBeNaN"
    | "toBeNull"
    | "toBeTruthy"
    | "toBeUndefined"
    | "toContain"
    | "toContainEqual"
    | "toEqual"
    | "toHaveLength"
    | "toHaveProperty"
    | "toMatch"
    | "toMatchObject"
    | "toStrictEqual";

  type MatcherFunctions = {
    [Name in BuiltInMatcherName]: MatcherFunctionDefiningMatcher<
      Matchers<void | Promise<void>>[Name]
    > &
      // We know that these are sync matchers and never return a Promise.
      ((...args: unknown[]) => SyncExpectationResult);
  };

  // Unfortunately, the module appears to nest the matchers in an extra
  // `default` object.
  const defaultExport: { default: MatcherFunctions };
  export default defaultExport;
}
