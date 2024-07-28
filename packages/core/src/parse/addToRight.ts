import { Algebra } from "sparqlalgebrajs";

import { af } from "../common";

/**
 * Adds an operation to the right side of a join, whether it's an inner join or
 * a left join. That is, if the patterns in {@link baseOp} are optional (which
 * is what a left join accomplishes), {@link additionalOp} will be as well.
 */
export const addToRight = (
  additionalOp: Algebra.Operation,
  baseOp: Algebra.Operation
) =>
  baseOp.type === Algebra.types.LEFT_JOIN
    ? af.createLeftJoin(
        baseOp.input[0],
        af.createJoin([additionalOp, baseOp.input[1]])
      )
    : af.createJoin([additionalOp, baseOp]);
