import fs from "node:fs";
import nodeModule from "node:module";
import path from "node:path";
import * as url from "node:url";

import { describe, it, expect } from "@jest/globals";
import { sortBy } from "rambdax";
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
    "http://swapi.dev/documentation#name": string;
    "http://swapi.dev/documentation#height": number;
    "http://swapi.dev/documentation#mass": number;
    "http://swapi.dev/documentation#title": string;
    "http://schema.org/description": string;
  }

  declare function withPropertyTypes<PropertyTypes>(): {
    document<Doc>(
      d: JsonLDDocument<PropertyTypes, {}, Doc>
    ): void
  }
`;

const getCompletions = (code: string) => {
  const service = languageService(code);

  expect(
    service.getSemanticDiagnostics(FILE_NAME).map((d) => d.messageText)
  ).toEqual([]);

  return service.getCompletionsAtPosition(FILE_NAME, code.indexOf("/*|*/"), {});
};

describe("JsonLDDocument", () => {
  describe("acceptance", () => {
    it("accepts a `@context`", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          name: "http://swapi.dev/documentation#name",
        } as const,
      });
    `;

      const service = languageService(code);

      expect(
        service.getSemanticDiagnostics(FILE_NAME).map((d) => d.messageText)
      ).toEqual([]);
    });

    it("rejects a non-const `@context`", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          name: "http://swapi.dev/documentation#name",
        },
      });
    `;

      const service = languageService(code);

      expect(
        service
          .getSemanticDiagnostics(FILE_NAME)
          .map((d) =>
            typeof d.messageText === "string"
              ? d.messageText
              : d.messageText.messageText
          )
      ).toEqual([
        "Type '{ name: string; }' is not assignable to type '{ error: \"Must be composed of only literal types. Try adding `as const`.\"; } & \"\"'.",
      ]);
    });

    it("accepts known IRI properties", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "http://swapi.dev/documentation#height": 123,
      });
    `;

      const service = languageService(code);

      expect(
        service.getSemanticDiagnostics(FILE_NAME).map((d) => d.messageText)
      ).toEqual([]);
    });

    it("accepts unknown IRI properties", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "http://www.example.com/unknown": 1,
      });
    `;

      const service = languageService(code);

      expect(
        service.getSemanticDiagnostics(FILE_NAME).map((d) => d.messageText)
      ).toEqual([]);
    });

    it("rejects known IRI properties with wrong type", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "http://swapi.dev/documentation#height": "a",
      });
    `;

      const service = languageService(code);

      expect(
        service.getSemanticDiagnostics(FILE_NAME).map((d) => d.messageText)
      ).toEqual(["Type 'string' is not assignable to type 'number'."]);
    });

    it("expands Node Object Keys which are Terms", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          name: "http://swapi.dev/documentation#name",
          name2: "http://swapi.dev/documentation#name",
        } as const,
        name: "Luke Skywalker",
        name2: 123,
      });
    `;

      const service = languageService(code);

      expect(
        service.getSemanticDiagnostics(FILE_NAME).map((d) => d.messageText)
      ).toEqual(["Type 'number' is not assignable to type 'string'."]);
    });

    it("expands Node Object Keys which are Compact IRIs", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          swapi: "http://swapi.dev/documentation#",
          swapi2: "http://swapi.dev/documentation#",
        } as const,
        "swapi:name": "Luke Skywalker",
        "swapi2:name": 123,
      });
    `;

      const service = languageService(code);

      expect(
        service.getSemanticDiagnostics(FILE_NAME).map((d) => d.messageText)
      ).toEqual(["Type 'number' is not assignable to type 'string'."]);
    });
  });

  describe("completions", () => {
    it("completes `@context`", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        /*|*/
      });
    `;

      const completions = getCompletions(code);

      expect(sortBy((c) => c.name, completions?.entries ?? [])).toMatchObject([
        expect.objectContaining({
          name: `"@context"`,
          kind: "property",
          kindModifiers: "optional",
        }),
      ]);
    });

    it("completes terms from the @context", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          height: "http://swapi.dev/documentation#height",
        } as const,
        /*|*/
      });
    `;

      const completions = getCompletions(code);

      expect(sortBy((c) => c.name, completions?.entries ?? [])).toMatchObject([
        expect.objectContaining({
          name: "height",
          kind: "property",
          kindModifiers: "optional",
        }),
      ]);
    });

    it("completes Node Object Keys which are Compact IRIs", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          swapi: "http://swapi.dev/documentation#",
        } as const,
        /*|*/
      });
    `;

      const completions = getCompletions(code);

      expect(sortBy((c) => c.name, completions?.entries ?? [])).toMatchObject([
        expect.objectContaining({
          name: '"swapi:height"',
          kind: "property",
          kindModifiers: "optional",
        }),
        expect.objectContaining({
          name: '"swapi:mass"',
          kind: "property",
          kindModifiers: "optional",
        }),
        expect.objectContaining({
          name: '"swapi:name"',
          kind: "property",
          kindModifiers: "optional",
        }),
        expect.objectContaining({
          name: '"swapi:title"',
          kind: "property",
          kindModifiers: "optional",
        }),
        expect.objectContaining({
          name: "swapi",
          kind: "property",
          kindModifiers: "optional",
        }),
      ]);
    });

    it("completes Node Object Keys which are vocab-mapped", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          "@vocab": "http://swapi.dev/documentation#",
        } as const,
        /*|*/
      });
    `;

      const completions = getCompletions(code);

      expect(sortBy((c) => c.name, completions?.entries ?? [])).toMatchObject([
        expect.objectContaining({
          name: "height",
          kind: "property",
          kindModifiers: "optional",
        }),
        expect.objectContaining({
          name: "mass",
          kind: "property",
          kindModifiers: "optional",
        }),
        expect.objectContaining({
          name: "name",
          kind: "property",
          kindModifiers: "optional",
        }),
        expect.objectContaining({
          name: "title",
          kind: "property",
          kindModifiers: "optional",
        }),
      ]);
    });
  });
});
