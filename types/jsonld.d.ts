// Because the DefinitelyTyped definitions are way out of date:
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/jsonld/index.d.ts
// TODO: Package and push upstream to "@types/jsonld".
declare module "jsonld" {
  import type { Quad as RDFQuad } from "@rdfjs/types";
  import type {
    NodeObject,
    ContextDefinition,
    JsonLdDocument,
  } from "jsonld/jsonld";
  import type {
    Url,
    // JsonLdProcessor,
    RemoteDocument,
    // NodeObject,
    // JsonLdArray,
  } from "jsonld/jsonld-spec";

  // Currently, jsonld returns incomplete Quad-likes.
  export type Quad = {
    [K in Extract<
      keyof RDFQuad,
      "subject" | "predicate" | "object" | "graph"
    >]: Omit<RDFQuad[K], "equals">;
  };

  export type * from "jsonld/jsonld";
  /**
   * Format option: Serialized as N-Quads.
   * @see https://www.w3.org/TR/n-quads/
   */
  type MimeNQuad = "application/n-quads" | "application/nquads";
  // /*
  //  * Declares interfaces used to type the methods options object.
  //  * The interfaces are usefull to avoid code replication.
  //  */
  export namespace Options {
    interface DocLoader {
      /**
       * The document loader.
       */
      documentLoader?:
        | ((
            url: Url,
            callback: (err: Error, remoteDoc: RemoteDocument) => void
          ) => Promise<RemoteDocument>)
        | undefined;
    }

    interface Common extends DocLoader {
      /**
       * The base IRI to use.
       */
      base?: string;
      /**
       * A context to expand with.
       */
      expandContext?: ContextDefinition;
      /**
       * `true` to use safe mode.
       * @default false
       */
      safe?: boolean;
    }

    interface Compact extends Common, DocLoader {
      /**
       * `true` to compact arrays to single values when appropriate, `false` not
       * to.
       * @default true
       */
      compactArrays?: boolean;
      /**
       * `true` to compact IRIs to be relative to document base, `false` to keep
       * absolute.
       * @default true
       */
      compactToRelative?: boolean;
      /**
       * `true` to always output a top-level graph.
       * @default false
       */
      graph?: boolean;
      /**
       * `true` to assume the input is expanded and skip expansion, `false` not
       * to.
       * @default false
       */
      skipExpansion?: boolean;
      /**
       * `true` if compaction is occuring during a framing operation.
       */
      framing?: boolean;
    }

    //   interface Expand extends Common {
    //     keepFreeFloatingNodes?: boolean | undefined;
    //   }
    //   type Flatten = Common;
    //   interface Frame {
    //     embed?: "@last" | "@always" | "@never" | "@link" | undefined;
    //     explicit?: boolean | undefined;
    //     requireAll?: boolean | undefined;
    //     omitDefault?: boolean | undefined;
    //     omitGraph?: boolean | undefined;
    //   }
    //   interface Normalize extends Common {
    //     algorithm?: "URDNA2015" | `URGNA2012` | undefined;
    //     skipExpansion?: boolean | undefined;
    //     expansion?: boolean | undefined;
    //     inputFormat?: MimeNQuad | undefined;
    //     format?: MimeNQuad | undefined;
    //     useNative?: boolean | undefined;
    //   }

    interface FromRdf extends Pick<Common, "safe"> {
      /**
       * The format if dataset param must first be parsed:
       * `"application/n-quads"` for N-Quads. Ignored if the dataset given is
       * not a string, when it will be expected as `Quad`s.
       * @see registerRDFParser
       */
      format?: MimeNQuad | undefined;

      /**
       * A custom RDF-parser to use to parse the dataset.
       */
      rdfParser?: (
        rdfSource: string
      ) => Iterable<Quad> | Promise<Iterable<Quad>>;

      /**
       * `true` to use rdf:type, false to use `@type`.
       * @default false
       */
      useRdfType?: boolean;
      /**
       * `true` to convert XSD types into native types (boolean, integer,
       * double), `false` not to.
       * @default false
       */
      useNativeTypes?: boolean | undefined;
      /**
       * `"i18n-datatype"` to support RDF transformation of `@direction`.
       */
      rdfDirection?: "i18n-datatype";
    }

    interface ToRdf<Format extends MimeNQuad | undefined> extends Common {
      /**
       * `true` to assume the input is expanded and skip expansion,
       * `false` not to.
       * @default false
       */
      skipExpansion?: boolean;
      /**
       * The format to use to output a string. `"application/n-quads"` for
       * N-Quads.
       */
      format?: Format;
      /**
       * `true` to output generalized RDF, `false` to produce only standard RDF.
       * @default false
       * @see https://www.w3.org/TR/rdf11-concepts/#section-generalized-rdf
       */
      produceGeneralizedRdf?: boolean;
    }
  }

  export function compact(
    input: JsonLdDocument,
    ctx: ContextDefinition,
    options?: Options.Compact
  ): Promise<NodeObject>;

  // export function expand(
  //   input: JsonLdDocument,
  //   options: Options.Expand,
  //   callback: Callback<JsonLdArray>
  // ): void;
  // export function expand(
  //   input: JsonLdDocument,
  //   callback: Callback<JsonLdArray>
  // ): void;
  // export function expand(
  //   input: JsonLdDocument,
  //   options?: Options.Expand
  // ): Promise<JsonLdArray>;
  // export function flatten(
  //   input: JsonLdDocument,
  //   ctx: ContextDefinition | null,
  //   options: Options.Flatten,
  //   callback: Callback<NodeObject>
  // ): void;
  // export function flatten(
  //   input: JsonLdDocument,
  //   ctx: ContextDefinition | null,
  //   callback: Callback<NodeObject>
  // ): void;
  // export function flatten(
  //   input: JsonLdDocument,
  //   ctx?: ContextDefinition,
  //   options?: Options.Flatten
  // ): Promise<NodeObject>;

  // export function frame(
  //   input: JsonLdDocument,
  //   frame: Frame,
  //   options?: Options.Frame
  // ): Promise<NodeObject>;

  // export function normalize(
  //   input: JsonLdDocument,
  //   options: Options.Normalize,
  //   callback: Callback<string>
  // ): void;
  // export function normalize(
  //   input: JsonLdDocument,
  //   callback: Callback<string>
  // ): void;
  // export function normalize(
  //   input: JsonLdDocument,
  //   options?: Options.Normalize
  // ): Promise<string>;
  // export const canonize: typeof normalize;

  export function fromRDF(
    dataset: Iterable<Quad>,
    options?: Options.FromRdf
  ): Promise<NodeObject[]>;

  export function toRDF(
    input: JsonLdDocument,
    options?: Options.ToRdf<undefined>
  ): Promise<Quad[]>;

  export function toRDF(
    input: JsonLdDocument,
    options?: Options.ToRdf<MimeNQuad>
  ): Promise<string>;

  // export let JsonLdProcessor: JsonLdProcessor;
  // disable autoexport
  // export {};
}

declare module "jsonld/jsonld" {
  // TODO: Most or all of the `| undefined`s can probably go. They were
  // mass-added by the DefinitelyTyped project.
  /*
   * Types from the jsonld Specification:
   * https://www.w3.org/TR/json-ld11/
   * @version 1.1
   */

  /*
   * Disable automatic exporting.
   * Some of these declarations are not needed externally.
   */
  export {};

  /**
   * A JSON-LD document MUST be valid JSON text as described in [RFC8259],
   * or some format that can be represented in the JSON-LD internal representation
   * that is equivalent to valid JSON text.
   * @see https://www.w3.org/TR/json-ld11/#dfn-json-ld-document
   * @see https://www.w3.org/TR/json-ld11/#json-ld-grammar
   */
  export type JsonLdDocument = NodeObject | NodeObject[];

  /**
   * A node object represents zero or more properties of a node
   * in the graph serialized by the JSON-LD document.
   * @see https://www.w3.org/TR/json-ld11/#node-objects
   */
  export interface NodeObject {
    "@context"?: Keyword["@context"];
    "@id"?: Keyword["@id"];
    "@included"?: Keyword["@included"];
    "@graph"?: Keyword["@included"];
    "@nest"?: OrArray<JsonObject>;
    "@type"?: OrArray<Keyword["@type"]>;
    "@reverse"?: Record<string, Keyword["@reverse"]>;
    "@index"?: Keyword["@index"];
    [key: string]:
      | OrArray<
          | null
          | boolean
          | number
          | string
          | NodeObject
          | GraphObject
          | ValueObject
          | ListObject
          | SetObject
        >
      | LanguageMap
      | IndexMap
      | IncludedBlock
      | IdMap
      | TypeMap
      | NodeObject[keyof NodeObject];
  }

  /**
   * A graph object represents a named graph, which MAY include an explicit graph name.
   * @see https://www.w3.org/TR/json-ld11/#graph-objects
   */
  export interface GraphObject {
    "@graph": OrArray<NodeObject>;
    "@index"?: Keyword["@index"];
    "@id"?: Keyword["@id"];
    "@context"?: Keyword["@context"];
  }

  /**
   * A value object is used to explicitly associate a type or a language with a value
   * to create a typed value or a language-tagged string and possibly associate a base direction.
   * @see https://www.w3.org/TR/json-ld11/#value-objects
   */
  export type ValueObject = {
    "@index"?: Keyword["@index"] | undefined;
    "@context"?: Keyword["@context"] | undefined;
  } & ( // A string, possibly a language-typed string
    | {
        "@value": Keyword["@value"];
        "@language"?: Keyword["@language"] | undefined;
        "@direction"?: Keyword["@direction"] | undefined;
      }
    // A typed value
    | {
        "@value": Keyword["@value"];
        "@type": Keyword["@type"];
      }
    // A JSON literal
    | {
        "@value": Keyword["@value"] | JsonObject | JsonArray;
        "@type": "@json";
      }
  );

  /**
   * A list represents an ordered set of values.
   * @see https://www.w3.org/TR/json-ld11/#lists-and-sets
   */
  export interface ListObject {
    "@list": Keyword["@list"];
    "@index"?: Keyword["@index"] | undefined;
  }

  /**
   * A set represents an unordered set of values.
   * @see https://www.w3.org/TR/json-ld11/#lists-and-sets
   */
  export interface SetObject {
    "@set": Keyword["@set"];
    "@index"?: Keyword["@index"] | undefined;
  }

  /**
   * A language map is used to associate a language with a value in a way that allows easy programmatic access.
   * @see https://www.w3.org/TR/json-ld11/#language-maps
   */
  export type LanguageMap = Record<string, null | string | string[]>;

  /**
   * An index map allows keys that have no semantic meaning, but should be preserved regardless,
   * to be used in JSON-LD documents.
   * @see https://www.w3.org/TR/json-ld11/#index-maps
   */
  export type IndexMap = Record<
    string,
    OrArray<
      | null
      | boolean
      | number
      | string
      | NodeObject
      | ValueObject
      | ListObject
      | SetObject
    >
  >;

  /**
   * An id map is used to associate an IRI with a value that allows easy programmatic access.
   * @see https://www.w3.org/TR/json-ld11/#id-maps
   */
  export type IdMap = Record<string, NodeObject>;

  /**
   * A type map is used to associate an IRI with a value that allows easy programmatic access.
   * @see https://www.w3.org/TR/json-ld11/#type-maps
   */
  export type TypeMap = Record<string, string | NodeObject>;

  /**
   * An included block is used to provide a set of node objects.
   * @see https://www.w3.org/TR/json-ld11/#included-blocks
   */
  export type IncludedBlock = OrArray<NodeObject>;

  /**
   * A context definition defines a local context in a node object.
   * @see https://www.w3.org/TR/json-ld11/#context-definitions
   */
  export interface ContextDefinition {
    "@base"?: Keyword["@base"] | undefined;
    "@direction"?: Keyword["@direction"] | undefined;
    "@import"?: Keyword["@import"] | undefined;
    "@language"?: Keyword["@language"] | undefined;
    "@propagate"?: Keyword["@propagate"] | undefined;
    "@protected"?: Keyword["@protected"] | undefined;
    "@type"?:
      | {
          "@container": "@set";
          "@protected"?: Keyword["@protected"] | undefined;
        }
      | undefined;
    "@version"?: Keyword["@version"] | undefined;
    "@vocab"?: Keyword["@vocab"] | undefined;
    [key: string]:
      | null
      | string
      | ExpandedTermDefinition
      | ContextDefinition[keyof ContextDefinition];
  }

  /**
   * An expanded term definition is used to describe the mapping between a term
   * and its expanded identifier, as well as other properties of the value
   * associated with the term when it is used as key in a node object.
   * @see https://www.w3.org/TR/json-ld11/#expanded-term-definition
   */
  export type ExpandedTermDefinition = {
    "@type"?: "@id" | "@json" | "@none" | "@vocab" | string | undefined;
    "@language"?: Keyword["@language"] | undefined;
    "@index"?: Keyword["@index"] | undefined;
    "@context"?: ContextDefinition | undefined;
    "@prefix"?: Keyword["@prefix"] | undefined;
    "@propagate"?: Keyword["@propagate"] | undefined;
    "@protected"?: Keyword["@protected"] | undefined;
  } & (
    | {
        "@id"?: Keyword["@id"] | null | undefined;
        "@nest"?: "@nest" | string | undefined;
        "@container"?: Keyword["@container"] | undefined;
      }
    | {
        "@reverse": Keyword["@reverse"];
        "@container"?: "@set" | "@index" | null | undefined;
      }
  );

  /**
   * A list of keywords and their types.
   * Only used for internal reference; not an actual interface.
   * Not for export.
   * @see https://www.w3.org/TR/json-ld/#keywords
   */
  interface Keyword {
    "@base": string | null;
    "@container":
      | OrArray<"@list" | "@set" | ContainerType>
      | ContainerTypeArray
      | null;
    "@context": OrArray<null | string | ContextDefinition>;
    "@direction": "ltr" | "rtl" | null;
    "@graph": OrArray<NodeObject>;
    "@id": OrArray<string>;
    "@import": string;
    "@included": IncludedBlock;
    "@index": string;
    "@json": "@json";
    "@language": string;
    "@list": OrArray<
      null | boolean | number | string | NodeObject | ValueObject
    >;
    "@nest": object;
    "@none": "@none";
    "@prefix": boolean;
    "@propagate": boolean;
    "@protected": boolean;
    "@reverse": string;
    "@set": OrArray<
      null | boolean | number | string | NodeObject | ValueObject
    >;
    "@type": string;
    "@value": null | boolean | number | string;
    "@version": "1.1";
    "@vocab": string | null;
  }

  /*
   * Helper Types
   * (not for export)
   */
  type OrArray<T> = T | T[];
  type ContainerType = "@language" | "@index" | "@id" | "@graph" | "@type";
  type ContainerTypeArray =
    | ["@graph", "@id"]
    | ["@id", "@graph"]
    | ["@set", "@graph", "@id"]
    | ["@set", "@id", "@graph"]
    | ["@graph", "@set", "@id"]
    | ["@id", "@set", "@graph"]
    | ["@graph", "@id", "@set"]
    | ["@id", "@graph", "@set"]
    | ["@set", ContainerType]
    | [ContainerType, "@set"];

  /*
   * JSON Types
   * (not for export)
   */
  type JsonPrimitive = string | number | boolean | null;
  type JsonArray = JsonValue[];
  // eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style, @typescript-eslint/consistent-type-definitions -- https://github.com/typescript-eslint/typescript-eslint/issues/7148
  type JsonObject = { [key: string]: JsonValue };
  type JsonValue = JsonPrimitive | JsonArray | JsonObject;
}

declare module "jsonld/jsonld-spec" {
  /*
   * Types from the jsonld Specification:
   * https://www.w3.org/TR/json-ld-api/
   *
   */
  import type { JsonLdDocument, NodeObject, ContextDefinition } from "jsonld";

  type DOMString = string;
  type LoadDocumentCallback = (url: Url) => Promise<RemoteDocument>;

  export type Url = DOMString;
  export type Iri = Url;
  export type Frame = NodeObject | Url;

  export interface Options {
    base?: DOMString | null | undefined;
    compactArrays?: boolean | undefined;
    documentLoader?: LoadDocumentCallback | null | undefined;
    expandContext?: ContextDefinition | null | undefined;
    processingMode?: DOMString | undefined;
  }

  export interface JsonLdProcessor {
    compact(
      input: JsonLdDocument,
      context: ContextDefinition,
      options?: Options
    ): Promise<NodeObject>;
    expand(input: JsonLdDocument, options?: Options): Promise<NodeObject[]>;
    flatten(
      input: JsonLdDocument,
      context?: ContextDefinition | null,
      options?: Options
    ): Promise<NodeObject>;
  }

  export interface RemoteDocument {
    contextUrl?: Url | undefined;
    documentUrl: Url;
    document: JsonLdDocument;
  }

  export {};
}
