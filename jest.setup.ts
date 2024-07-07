import { expect } from "@jest/globals";

import {
  type ToBeBindingsEqualToMatchers,
  toBeBindingsEqualTo,
} from "./test-util/toBeBindingsEqualTo";
import {
  type ToBeSparqlEqualToMatchers,
  toBeSparqlEqualTo,
} from "./test-util/toBeSparqlEqualTo";

expect.extend({ toBeBindingsEqualTo, toBeSparqlEqualTo });

declare module "expect" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Matchers<R>
    extends ToBeBindingsEqualToMatchers<R>,
      ToBeSparqlEqualToMatchers<R> {}
}

import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextDecoder, TextEncoder });
