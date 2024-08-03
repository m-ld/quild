import fs from "node:fs";
import nodeModule from "node:module";
import path from "node:path";
import * as url from "node:url";

import { describe, it, expect } from "@jest/globals";
import * as ts from "typescript";

const require = nodeModule.createRequire(import.meta.url);

const FILE_NAME = path.dirname(url.fileURLToPath(import.meta.url)) + "/code.ts";

const languageService = (code: string) => {
  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => [
      require.resolve("./JsonLDDocument.ts"),
      FILE_NAME,
    ],
    getScriptVersion: () => "",
    getScriptSnapshot: (fileName) => {
      if (fileName === FILE_NAME) {
        return ts.ScriptSnapshot.fromString(code);
      } else if (!fs.existsSync(fileName)) {
        return undefined;
      } else {
        return ts.ScriptSnapshot.fromString(
          fs.readFileSync(fileName).toString()
        );
      }
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => ({}),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),

    /* eslint-disable @typescript-eslint/unbound-method -- These are correct. */
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
    /* eslint-enable @typescript-eslint/unbound-method -- ^^^ */
  };

  return ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
};

const setup = /* ts */ `
  import type { JsonLDDocument } from "./JsonLDDocument";

  interface PT {
    "http://www.example.com/aNumber": number;
    "http://www.example.com/multipleNumbers": number;
    "http://www.example.com/aString": string;
    "http://www.example.com/multipleStrings": string;
    "http://www.example.com/aNumberVariable": number;
    "http://www.example.com/aStringVariable": string;
    "http://www.example.com/anArrayOfString": string;
  }

  declare function withPropertyTypes<PropertyTypes>(): {
    document<Doc>(
      d: JsonLDDocument<PropertyTypes, {}, Doc>
    ): void
  }
`;

const getCompletions = (code: string) => {
  const service = languageService(code);

  expect(service.getSemanticDiagnostics(FILE_NAME)).toEqual([]);

  return service.getCompletionsAtPosition(FILE_NAME, code.indexOf("/*|*/"), {});
};

describe("JsonLDDocument", () => {
  it("completes `@context`", () => {
    const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        /*|*/
      });
    `;

    const completions = getCompletions(code);

    expect(completions).toMatchObject({
      entries: [
        expect.objectContaining({
          name: `"@context"`,
          kind: "property",
          kindModifiers: "optional",
        }),
      ],
    });
  });

  it("completes terms from the @context", () => {
    const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          aNumber: "http://www.example.com/aNumber",
        } as const,
        /*|*/
      });
    `;

    const completions = getCompletions(code);

    expect(completions).toMatchObject({
      entries: [
        expect.objectContaining({
          name: "aNumber",
          kind: "property",
          kindModifiers: "optional",
        }),
      ],
    });
  });

  it("accepts known IRI properties", () => {
    const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "http://www.example.com/aNumber": 1,
      });
    `;

    const service = languageService(code);

    expect(service.getSemanticDiagnostics(FILE_NAME)).toEqual([]);
  });

  it("accepts unknown IRI properties", () => {
    const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "http://www.example.com/unknown": 1,
      });
    `;

    const service = languageService(code);

    expect(service.getSemanticDiagnostics(FILE_NAME)).toEqual([]);
  });

  it("rejects known IRI properties with wrong type", () => {
    const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "http://www.example.com/aNumber": "a",
      });
    `;

    const service = languageService(code);

    expect(
      service.getSemanticDiagnostics(FILE_NAME).map((d) => d.messageText)
    ).toEqual(["Type 'string' is not assignable to type 'number'."]);
  });
});
