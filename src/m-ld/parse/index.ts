import { MeldListObject } from "./MeldListObject";
import { makeParser } from "../../parse";

export { MeldListObject } from "./MeldListObject";

export const parser = makeParser({ ListObject: MeldListObject });
