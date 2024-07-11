import { TextEncoder, TextDecoder } from "util";

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
  interface Matchers<R>
    extends ToBeBindingsEqualToMatchers<R>,
      ToBeSparqlEqualToMatchers<R> {}
}

Object.assign(global, { TextDecoder, TextEncoder });
