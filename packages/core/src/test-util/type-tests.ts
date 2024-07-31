// This module should not be executed. It should only be used in *.type-test.ts
// files, which should only be type-checked, not executed.

// These functions allow a *.type-test.ts file to take the form of a test file.

export declare function describe(
  name: unknown,
  fn: () => void | Promise<void>
): void;
export declare function it(name: unknown, fn: () => void | Promise<void>): void;
