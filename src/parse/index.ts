import { nullContext, parser } from "./common";
import { af, df } from "../common";

import type { JsonValue } from "type-fest";

export const parseQuery = async (query: JsonValue) => {
  const { intermediateResult, patterns, projections, warnings } =
    await parser.Document({
      element: query,
      variable: df.variable("root"),
      ctx: await nullContext(),
    });

  return {
    intermediateResult,
    sparql: af.createProject(af.createBgp(patterns), projections),
    warnings,
  };
};
