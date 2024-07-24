import { TextEncoder, TextDecoder } from "util";

import "setimmediate";

Object.assign(global, { TextDecoder, TextEncoder });
