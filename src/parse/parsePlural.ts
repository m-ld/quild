/* eslint-disable @typescript-eslint/consistent-type-assertions */
/* eslint-disable @typescript-eslint/no-throw-literal */
import { isPlainObject } from "lodash-es";

import { nestWarningsUnderKey, type Parsed } from "./common";
import { parseNodeObject } from "./parseNodeObject";
import * as IR from "../IntermediateResult";
import { evolve, prepend } from "../upstream/rambda";

import type * as RDF from "@rdfjs/types";
import type Context from "jsonld/lib/context";

export const parsePlural = async ({
  query,
  variable,
  ctx: outerCtx,
}: {
  query: unknown[];
  variable: RDF.Variable;
  ctx: Context.ActiveContext;
}): Promise<Parsed<IR.Plural>> => {
  const soleSubquery = query[0];
  if (!(soleSubquery && query.length === 1)) {
    throw "TODO: Only exactly one subquery is supported in an array, so far.";
  }

  if (!isPlainObject(soleSubquery))
    throw "TODO: Only objects can be in plural nodes, so far.";

  const soleSubqueryPlainObject = soleSubquery as Record<string, unknown>;

  return evolve(
    {
      intermediateResult: (ir) => new IR.Plural(variable, ir),
      projections: prepend(variable)<RDF.Variable>,
      warnings: nestWarningsUnderKey(0),
    },
    await parseNodeObject({
      query: soleSubqueryPlainObject,
      variable,
      ctx: outerCtx,
    })
  );
};
