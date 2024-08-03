type NoInfer<T> = [T][T extends any ? 0 : never];

type Iri<
  Prefix extends string = string,
  Suffix extends string = string
> = `${Prefix}:${Suffix}`;

// TODO: Incomplete
export type NextContext<OuterContext, InnerContext> = OuterContext &
  InnerContext;

// prettier-ignore
export type NodeObject<PropertyTypes, OuterContext, Self> =
  // Calculate the active context
  NextContext<
    OuterContext,
    "@context" extends keyof Self ? Self["@context"] : {}
  > extends infer ActiveContext ?
    // NodeObjects may have...
    // The built-in keywords:
    { "@context"?: unknown } &
    // Any terms defined in the active context:
    {
      // For each key K in the active context...
      [K in keyof ActiveContext]?:
        // If K is an alias for a property with a known type, use that type.
        ActiveContext[K] extends keyof PropertyTypes
          ? PropertyTypes[ActiveContext[K]]

        // Else, if K is in the object, it's a NodeObject
        // (TODO: That's woefully incomplete)
        : K extends keyof Self
          ? NodeObject<PropertyTypes, ActiveContext, Self[K]>

        // Lastly, if it's not in the object, it's not in the object.
        : never;
    } &
    // Any IRI keys already in the object, with a type if known:
    {
      [K in (keyof Self) & Iri]?:
        K extends keyof PropertyTypes ? PropertyTypes[K] : unknown
    } &
    // And nothing else:
    {
      [K in Exclude<
        keyof Self,
        keyof ActiveContext | keyof PropertyTypes | Iri | "@context"
      >]?: never;
    }
    // /infer ActiveContext
    : never;

export type JsonLDDocument<PropertyTypes, OuterContext, Self> = {
  // This trick ensures Self is inferred to be the entire object this type is
  // applied to, while the resulting type leaves the *values* of those keys as
  // `unknown`.
  [K in keyof Self]: K extends never ? Self[K] : unknown;
} & NoInfer<NodeObject<PropertyTypes, OuterContext, Self>>;
