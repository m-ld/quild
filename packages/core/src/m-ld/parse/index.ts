import { MeldListArray } from "./MeldListArray";
import { makeParser } from "../../parse";

export { MeldListArray } from "./MeldListArray";

export const parser = makeParser({ ListArray: MeldListArray });
