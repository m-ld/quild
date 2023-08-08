import jsonld from "jsonld";

import { isArray } from "./common";
import { parseNodeObject } from "./parseNodeObject";
import { parsePlural } from "./parsePlural";
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
  jsonld.processContext(null as unknown as jsonld.ActiveContext, null, options);

export const parse = async (
  query: jsonld.NodeObject | readonly jsonld.NodeObject[]
) => {
  const { intermediateResult, patterns, projections, warnings } =
    await (isArray(query)
      ? parsePlural(query, df.variable("root"), await nullContext())
      : parseNodeObject(query, df.variable("root"), await nullContext()));

  return {
    intermediateResult,
    sparql: af.createProject(af.createBgp(patterns), projections),
    warnings,
  };
};
