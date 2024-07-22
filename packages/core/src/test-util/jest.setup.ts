import { expect } from "@jest/globals";

import {
  type ToBeBindingsEqualToMatchers,
  toBeBindingsEqualTo,
} from "./toBeBindingsEqualTo";
import {
  type ToBeSparqlEqualToMatchers,
  toBeSparqlEqualTo,
} from "./toBeSparqlEqualTo";

expect.extend({ toBeBindingsEqualTo, toBeSparqlEqualTo });

declare module "expect" {
  interface Matchers<R>
    extends ToBeBindingsEqualToMatchers<R>,
      ToBeSparqlEqualToMatchers<R> {}
}
