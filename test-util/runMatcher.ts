import ansiRegex from "./ansiRegex";

// Strip color from snapshots, for better readability and for better consistency.
const stripAnsi = (message: string): string => message.replace(ansiRegex(), "");

/* eslint-disable-next-line @typescript-eslint/no-explicit-any
   ---
   We need `any` here to match any kind of function, bivariantly.
 */
type SomeFunction = (...args: any[]) => any;

export const runMatcher =
  <
    Matchers extends {
      [K in MatcherName]: SomeFunction;
    },
    MatcherName extends keyof Matchers
  >(
    expect: (actual: unknown) => Matchers,
    matcherName: MatcherName
  ) =>
  (
    actual: unknown,
    ...expected: Matchers[MatcherName] extends SomeFunction
      ? Parameters<Matchers[MatcherName]>
      : never
  ) => {
    try {
      expect(actual)[matcherName](...expected);
      return "<Pass>";
    } catch (e) {
      if (!(e instanceof Error))
        throw new Error(
          `Expect() threw something that wasn't an Error: ${JSON.stringify(e)}`
        );
      return stripAnsi(e.message);
    }
  };
