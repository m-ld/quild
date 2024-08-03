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
  import type { EmptyContext } from "./Context";

  interface PT {
    "http://swapi.dev/documentation#name": string;
    "http://swapi.dev/documentation#height": number;
    "http://swapi.dev/documentation#mass": number;
    "http://swapi.dev/documentation#title": string;
    "http://swapi.dev/documentation#homeworld": object;
    "http://swapi.dev/documentation#films": object;
    "http://schema.org/description": string;
    "http://schema.org/alternateName": string;
  }

  declare function withPropertyTypes<PropertyTypes>(): {
    document<Doc>(
      d: JsonLDDocument<PropertyTypes, EmptyContext, Doc>
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
    it("accepts `@context`, `@id`, and `@type`", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          name: "http://swapi.dev/documentation#name",
        } as const,
        "@id": "http://swapi.dev/people/1",
        "@type": "http://swapi.dev/documentation#Person",
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

    it("expands Node Object Keys which are vocab-mapped", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          "@vocab": "http://swapi.dev/documentation#",
        } as const,
        "name": 123,
      });
    `;

      const service = languageService(code);

      expect(
        service.getSemanticDiagnostics(FILE_NAME).map((d) => d.messageText)
      ).toEqual(["Type 'number' is not assignable to type 'string'."]);
    });

    it("accepts arrays", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document([{
        "@context": {
          swapi: "http://swapi.dev/documentation#",
          swapi2: "http://swapi.dev/documentation#",
        } as const,
        "swapi:name": "Luke Skywalker",
        "swapi2:name": 123,
      }]);
    `;

      const service = languageService(code);

      expect(
        service.getSemanticDiagnostics(FILE_NAME).map((d) => d.messageText)
      ).toEqual(["Type 'number' is not assignable to type 'string'."]);
    });

    it("accepts nested objects", () => {
      const code = /* ts */ `
        ${setup}

        withPropertyTypes<PT>().document({
          "@context": {
            "@vocab": "http://swapi.dev/documentation#",
          } as const,
          name: 123,
          homeworld: {
            "@context": {
              schema: "http://schema.org/",
            } as const,
            name: 234,
            "schema:description": 345,
            "schema:nonsense": 456,
          },
        });
      `;

      const service = languageService(code);

      expect(
        service
          .getSemanticDiagnostics(FILE_NAME)
          .map((d) => [d.start, d.messageText])
      ).toEqual([
        [
          code.indexOf("name: 123"),
          "Type 'number' is not assignable to type 'string'.",
        ],
        [
          code.indexOf("name: 234"),
          "Type 'number' is not assignable to type 'string'.",
        ],
        [
          code.indexOf(`"schema:description": 345`),
          "Type 'number' is not assignable to type 'string'.",
        ],
        [
          code.indexOf(`"schema:nonsense": 456`),
          expect.stringMatching(
            /^Type 'number' has no properties in common with type/
          ),
        ],
      ]);
    });

    it("accepts nested objects with arrays", () => {
      const code = /* ts */ `
        ${setup}

        withPropertyTypes<PT>().document({
          "@context": {
            "@vocab": "http://swapi.dev/documentation#",
          } as const,
          name: 123,
          films: [
            {
              "@context": {
                schema: "http://schema.org/",
              } as const,
              title: 234,
              "schema:description": 345,
              "schema:nonsense": 456,
            },
          ],
        });
      `;

      const service = languageService(code);

      expect(
        service
          .getSemanticDiagnostics(FILE_NAME)
          .map((d) => [d.start, d.messageText])
      ).toEqual([
        [
          code.indexOf("name: 123"),
          "Type 'number' is not assignable to type 'string'.",
        ],
        [
          code.indexOf("title: 234"),
          "Type 'number' is not assignable to type 'string'.",
        ],
        [
          code.indexOf(`"schema:description": 345`),
          "Type 'number' is not assignable to type 'string'.",
        ],
        [
          code.indexOf(`"schema:nonsense": 456`),
          expect.stringMatching(
            /^Type 'number' has no properties in common with type/
          ),
        ],
      ]);
    });
  });

  describe("completions", () => {
    it("completes `@context`, `@id`, and `@type`", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        /*|*/
      });
    `;

      const completions = getCompletions(code);

      expect(
        (completions?.entries ?? []).map((c) => c.name).toSorted()
      ).toEqual([`"@context"`, `"@id"`, `"@type"`]);
    });

    it("completes terms from the @context", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          height: "http://swapi.dev/documentation#height",
        } as const,
        "@id": "http://swapi.dev/people/1",
        "@type": "http://swapi.dev/documentation#Person",
        /*|*/
      });
    `;

      const completions = getCompletions(code);

      expect(
        (completions?.entries ?? []).map((c) => c.name).toSorted()
      ).toEqual(["height"]);
    });

    it("completes Node Object Keys which are Compact IRIs", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          swapi: "http://swapi.dev/documentation#",
        } as const,
        "@id": "http://swapi.dev/people/1",
        "@type": "http://swapi.dev/documentation#Person",
        /*|*/
      });
    `;

      const completions = getCompletions(code);

      expect(
        (completions?.entries ?? []).map((c) => c.name).toSorted()
      ).toEqual([
        '"swapi:films"',
        '"swapi:height"',
        '"swapi:homeworld"',
        '"swapi:mass"',
        '"swapi:name"',
        '"swapi:title"',
        "swapi",
      ]);
    });

    it("completes Node Object Keys which are vocab-mapped", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document({
        "@context": {
          "@vocab": "http://swapi.dev/documentation#",
        } as const,
        "@id": "http://swapi.dev/people/1",
        "@type": "http://swapi.dev/documentation#Person",
        /*|*/
      });
    `;

      const completions = getCompletions(code);

      expect(
        (completions?.entries ?? []).map((c) => c.name).toSorted()
      ).toEqual(["films", "height", "homeworld", "mass", "name", "title"]);
    });

    it("completes terms in arrays", () => {
      const code = /* ts */ `
      ${setup}

      withPropertyTypes<PT>().document([{
        "@context": {
          height: "http://swapi.dev/documentation#height",
        } as const,
        "@id": "http://swapi.dev/people/1",
        "@type": "http://swapi.dev/documentation#Person",
        /*|*/
      }]);
    `;

      const completions = getCompletions(code);

      expect(
        (completions?.entries ?? []).map((c) => c.name).toSorted()
      ).toEqual(["height"]);
    });

    it("completes nested objects", () => {
      const code = /* ts */ `
        ${setup}

        withPropertyTypes<PT>().document({
          "@context": {
            "@vocab": "http://swapi.dev/documentation#",
          } as const,
          homeworld: {
            "@context": {
              schema: "http://schema.org/",
            } as const,
            /*|*/
          },
        });
      `;

      const completions = getCompletions(code);

      expect(
        (completions?.entries ?? []).map((c) => c.name).toSorted()
      ).toEqual([
        '"@id"',
        '"@type"',
        '"schema:alternateName"',
        '"schema:description"',
        "films",
        "height",
        "homeworld",
        "mass",
        "name",
        "schema",
        "title",
      ]);
    });

    it("completes nested objects with arrays", () => {
      const code = /* ts */ `
        ${setup}

        withPropertyTypes<PT>().document({
          "@context": {
            "@vocab": "http://swapi.dev/documentation#",
          } as const,
          films: [
            {
              "@context": {
                schema: "http://schema.org/",
              } as const,
              /*|*/
            },
          ],
        });        
      `;

      const completions = getCompletions(code);

      expect(
        (completions?.entries ?? []).map((c) => c.name).toSorted()
      ).toEqual([
        '"@id"',
        '"@type"',
        '"schema:alternateName"',
        '"schema:description"',
        "films",
        "height",
        "homeworld",
        "mass",
        "name",
        "schema",
        "title",
      ]);
    });
  });
});
