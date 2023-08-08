import { map } from "rambdax";

import { evolve, prepend } from "../upstream/rambda";

import type * as IR from "../IntermediateResult";
import type * as RDF from "@rdfjs/types";
import type { Algebra } from "sparqlalgebrajs";

export interface ParseWarning {
  message: string;
  path: Array<string | number>;
}

export interface Parsed<IRType extends IR.IntermediateResult> {
  intermediateResult: IRType;
  patterns: Algebra.Pattern[];
  projections: RDF.Variable[];
  warnings: ParseWarning[];
}

/**
 * Array.isArray, but typed to properly narrow types which may be readonly
 * arrays.
 *
 * @see https://github.com/microsoft/TypeScript/issues/17002
 */
export const isArray = Array.isArray as (
  arg: unknown
) => arg is readonly unknown[];

export const nestWarningsUnderKey = (
  key: ParseWarning["path"][number]
): ((
  iterable: ParseWarning[]
) => Array<{ message: string; path: Array<typeof key> }>) =>
  map(
    evolve({
      path: prepend(key)<typeof key>,
    })
  );
