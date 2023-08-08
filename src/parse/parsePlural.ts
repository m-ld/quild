/* eslint-disable @typescript-eslint/no-throw-literal */
import { nestWarningsUnderKey, type Parsed } from "./common";
import { parseNodeObject } from "./parseNodeObject";
import * as IR from "../IntermediateResult";
import { evolve, prepend } from "../upstream/rambda";

import type * as RDF from "@rdfjs/types";
import type jsonld from "jsonld";
import type Context from "jsonld/lib/context";

export const parsePlural = async (
  query: readonly jsonld.NodeObject[],
  parent: RDF.Variable,
  outerCtx: Context.ActiveContext
): Promise<Parsed<IR.Plural>> => {
  const soleSubquery = query[0];
  if (!(soleSubquery && query.length === 1)) {
    throw "TODO: Only exactly one subquery is supported in an array, so far.";
  }

  return evolve(
    {
      intermediateResult: (ir) => new IR.Plural(parent, ir),
      projections: prepend(parent)<RDF.Variable>,
      warnings: nestWarningsUnderKey(0),
    },
    await parseNodeObject(soleSubquery, parent, outerCtx)
  );
};
