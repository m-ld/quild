import { nullContext } from "./common";
import { parseDocument } from "./parseDocument";
import { af, df } from "../common";

import type { JsonValue } from "type-fest";

export const parseQuery = async (query: JsonValue) => {
  const { intermediateResult, patterns, projections, warnings } =
    await parseDocument({
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
