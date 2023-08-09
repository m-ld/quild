/* eslint-disable @typescript-eslint/no-throw-literal */
import jsonld from "jsonld";
import { isArray } from "lodash-es";

import { type Parsed, isPlainObject } from "./common";
import { parseNode } from "./parseNode";
import { af, df } from "../common";

/**
 * Returns a null (empty, initial) `ActiveContext`.
 */
const nullContext = (
  options?: jsonld.ProcessingOptions
): Promise<jsonld.ActiveContext> =>
  // Relies on `jsonld.processContext()` short-circuiting when the local context
  // is `null`. Otherwise, there's no way to get an initial context using the
  // public API.
  /* eslint-disable-next-line @typescript-eslint/consistent-type-assertions
     --
     Only way to make this work. */
  jsonld.processContext(null as unknown as jsonld.ActiveContext, null, options);

export const parse = async (
  query: jsonld.NodeObject | readonly jsonld.NodeObject[]
) => {
  let parsed: Parsed;

  if (isArray(query) || isPlainObject(query)) {
    parsed = await parseNode({
      query,
      variable: df.variable("root"),
      ctx: await nullContext(),
    });
  } else {
    throw "TODO: Unknown type of query";
  }

  const { intermediateResult, patterns, projections, warnings } = parsed;

  return {
    intermediateResult,
    sparql: af.createProject(af.createBgp(patterns), projections),
    warnings,
  };
};
