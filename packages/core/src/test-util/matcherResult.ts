import ansiRegex from "./ansiRegex";

// Strip color from snapshots, for better readability and for better consistency.
const stripAnsi = (message: string): string => message.replace(ansiRegex(), "");

export const matcherResult = (f: () => void) => {
  try {
    f();
    return "<Pass>";
  } catch (e) {
    if (!(e instanceof Error))
      throw new Error(
        `Expect() threw something that wasn't an Error: ${JSON.stringify(e)}`
      );
    return stripAnsi(e.message);
  }
};
