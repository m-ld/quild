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
    Frame,
  } from "jsonld/jsonld-spec";
  import type { ActiveContext } from "jsonld/lib/context";

  // Currently, jsonld returns incomplete Quad-likes.
  export type Quad = {
    [K in Extract<
      keyof RDFQuad,
      "subject" | "predicate" | "object" | "graph"
    >]: Omit<RDFQuad[K], "equals">;
  };

  export type * from "jsonld/jsonld";
  export type * from "jsonld/jsonld-spec";

  /**
   * Format option: Serialized as N-Quads.
   * @see https://www.w3.org/TR/n-quads/
   */
  type MimeNQuad = "application/n-quads" | "application/nquads";

  /** Something which, when awaited, produces a T. */
  type Awaitable<T> = T | PromiseLike<T>;

  export namespace Options {
    interface DocLoader {
      /**
       * The document loader.
       */
      documentLoader?: (url: Url) => Awaitable<RemoteDocument>;
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

    /**
     * @see https://www.w3.org/TR/json-ld11-framing/#idl-index
     */
    interface Frame extends Common {
      /**
       * Default `@embed` flag value.
       * @default '@last'
       */
      embed?: "@last" | "@always" | "@never" | "@link";
      /**
       * Default `@explicit` flag value.
       * @default false
       */
      explicit?: boolean;
      /**
       * Default `@requireAll` flag value.
       * @default true
       */
      requireAll?: boolean;
      /**
       * Default `@omitDefault` flag value.
       * @default false
       */
      omitDefault?: boolean;
      /**
       * Default `@omitGraph` flag value.
       * @default false
       */
      omitGraph?: boolean;
    }
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
    ctx: NodeObject["@context"],
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

  /**
   * Performs JSON-LD framing.
   *
   * @param input The JSON-LD input to frame.
   * @param frame The JSON-LD frame to use.
   * @param options The framing options.
   *
   * @return a Promise that resolves to the framed output.
   * @see https://www.w3.org/TR/json-ld11-framing/
   */
  export function frame(
    input: JsonLdDocument,
    frame: Frame,
    options?: Options.Frame
  ): Promise<NodeObject>;

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

  export function processContext(
    activeCtx: ActiveContext,
    localCtx: NodeObject["@context"]
    // TODO: Not sure what this should be yet.
    // options?: Options.Common
  ): Promise<ActiveContext>;

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
    "@base"?: Keyword["@base"];
    "@direction"?: Keyword["@direction"];
    "@import"?: Keyword["@import"];
    "@language"?: Keyword["@language"];
    "@propagate"?: Keyword["@propagate"];
    "@protected"?: Keyword["@protected"];
    "@type"?: {
      "@container": "@set";
      "@protected"?: Keyword["@protected"];
    };
    "@version"?: Keyword["@version"];
    "@vocab"?: Keyword["@vocab"];
    [key: string]:
      | null
      | string
      | ExpandedTermDefinition
      // Only here to be compatible with the explicit keys above, as there's no
      // good way to write an index signature for "everything but keywords".
      | Exclude<ContextDefinition[keyof ContextDefinition], undefined>;
  }

  /* eslint-disable-next-line @typescript-eslint/no-empty-interface
     --------
     Must be an interface to make HintedUnion behave correctly.
   */
  interface HintedUnionAnything {}

  /**
   * A non-literal type which provides a finite set of literal hints for editor
   * ergonomics. Whereas `"a" | "b" | string` will be optimized to just `string`
   * and lose autocompletion for "a" and "b", `HintedUnion<"a" | "b", string>`
   * will preserve the literals for autocompletion, while still accepting any
   * string. The resulting type will be type-equivalent to `LiteralUnion |
   * Catchall`. Typically everything in `LiteralUnion` will extend `Catchall`, and
   * thus the resulting type is also type-equivalent to just `Catchall`, but this
   * is not required.
   *
   * @see https://github.com/microsoft/TypeScript/issues/29729#issuecomment-1483854699
   *
   * @param LiteralUnion A union of literal values to autocomplete in editors.
   * @param Catchall A more general type to accept.
   *
   * @example
   * type Name = HintedUnion<"Jane" | "John", string>;
   * const name1: Name = <insertion point> // Autocompletes "Jane" and "John"
   * const name2: Name = "Eleanor"         // Still accepts any string
   */
  type HintedUnion<LiteralUnion, Catchall> =
    | LiteralUnion
    | (Catchall & HintedUnionAnything);

  /**
   * An expanded term definition is used to describe the mapping between a term
   * and its expanded identifier, as well as other properties of the value
   * associated with the term when it is used as key in a node object.
   * @see https://www.w3.org/TR/json-ld11/#expanded-term-definition
   */
  export type ExpandedTermDefinition = {
    "@type"?: HintedUnion<"@id" | "@json" | "@none" | "@vocab", string>;
    "@language"?: Keyword["@language"];
    "@index"?: Keyword["@index"];
    "@context"?: ContextDefinition;
    "@prefix"?: Keyword["@prefix"];
    "@propagate"?: Keyword["@propagate"];
    "@protected"?: Keyword["@protected"];
  } & (
    | {
        "@id"?: HintedUnion<keyof Keyword, Keyword["@id"]> | null;
        /**
         * @see https://www.w3.org/TR/json-ld11/#nested-properties
         */
        "@nest"?: HintedUnion<"@nest", string>;
        "@container"?: Keyword["@container"];
      }
    | {
        "@reverse": Keyword["@reverse"];
        "@container"?: "@set" | "@index" | null;
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
    "@id": string;
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
    base?: DOMString | null;
    compactArrays?: boolean;
    documentLoader?: LoadDocumentCallback | null;
    expandContext?: ContextDefinition | null;
    processingMode?: DOMString;
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
    /** A context URL found in a Link header, if any. */
    contextUrl?: Url;
    documentUrl: Url;
    document: JsonLdDocument;
  }

  export {};
}

declare module "jsonld/lib/context" {
  import type { Options, Iri } from "jsonld/jsonld-spec";

  /**
   * A mapping in the context. Left opaque for now.
   */
  type Mapping = unknown;

  /**
   * An object representing a context, which the processor passes around during
   * processing. Notably, *not* a {@link ContextDefinition}, which is how a
   * context is defined in a JSON-LD document. Defined here as an opaque type,
   * because the details of its innards are not worth specifying. Always use
   * processing functions to create a new `ActiveContext`.
   */
  export interface ActiveContext {
    readonly [contextTag]: typeof contextTag;
  }
  const contextTag: unique symbol;

  /**
   * Gets the initial context.
   *
   * @param options Processing options.
   * @return The initial context.
   */
  export function getInitialContext(options: Options): ActiveContext;

  /**
   * Expands a string to a full IRI. The string may be a term, a prefix, a
   * relative IRI, or an absolute IRI. The associated absolute IRI will be
   * returned.
   *
   * @param activeCtx The current active context.
   * @param value The string to expand.
   * @param relativeTo Options for how to resolve relative IRIs:
   * @param options Processing options.
   *
   * @return The expanded value.
   */
  export function expandIri(
    activeCtx: ActiveContext,
    value: string,
    relativeTo: {
      /** `true` to resolve against the base IRI, `false` not to. */
      base: boolean;
      /** `true` to concatenate after `@vocab`, `false` not to. */
      vocab: boolean;
    },
    options?: Options
  ): Iri;
}
