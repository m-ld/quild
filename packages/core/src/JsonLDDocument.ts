import type {
  ContextConstraint,
  ContextOf,
  Iri,
  PropagatedContext,
  TypeOfPropertyAtKey,
} from "./Context";
import type {
  IsLiteral,
  Primitive,
  UnionToIntersection,
  ValueOf,
} from "type-fest";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any
   --
   Necessary for fun TypeScript tricks. */
type NoInfer<T> = [T][T extends any ? 0 : never];

type IsLiteralDeep<T> = T extends Primitive
  ? IsLiteral<T>
  : { [K in keyof T]: IsLiteralDeep<T[K]> } extends infer O
  ? O[keyof O] extends true
    ? true
    : false
  : never;

type Const<T> = IsLiteralDeep<T> extends true
  ? T
  : {
      error: "Must be composed of only literal types. Try adding `as const`.";
    } & "";

/**
 * The Compact IRIs which can expand under the given {@link Context} to a known
 * property from the given {@link PropertyTypes}.
 */
type CompactIriKeys<
  Context extends ContextConstraint,
  PropertyTypes
> = UnionToIntersection<
  ValueOf<{
    [T in keyof Context & string]: {
      [P in keyof PropertyTypes as P extends `${Context[T]}${infer Suffix}`
        ? // A "suffix" that's an empty string doesn't count.
          Suffix extends ""
          ? never
          : Iri<T, Suffix>
        : never]?: PropertyTypes[P];
    };
  }>
>;

// Just to prove to TypeScript that this extends ContextConstraint.
type ValidContext<C extends ContextConstraint> = C;

export type NodeObject<
  PropertyTypes,
  OuterContext extends ContextConstraint,
  Self
> =
  // Calculate the active context
  PropagatedContext<OuterContext, ContextOf<Self>> extends ValidContext<
    infer ActiveContext
  >
    ? // NodeObjects may have...
      // The built-in keywords:
      {
        "@context"?: "@context" extends keyof Self
          ? Const<Self["@context"]>
          : never;
      } & {
        // Any terms defined in the active context:
        // For each key K in the active context...
        [K in keyof ActiveContext]?: ActiveContext[K] extends keyof PropertyTypes // If K is an alias for a property with a known type, use that type.
          ? PropertyTypes[ActiveContext[K]]
          : // Else, if K is in the object, it's a NodeObject
          // (TODO: That's woefully incomplete)
          K extends keyof Self
          ? NodeObject<PropertyTypes, ActiveContext, Self[K]>
          : // Lastly, if it's not in the object, it's not in the object.
            never;
      } & CompactIriKeys<ActiveContext, PropertyTypes> & {
          // Any IRI keys already in the object, with a type if known:
          [K in keyof Self & Iri]?: TypeOfPropertyAtKey<
            K,
            ActiveContext,
            PropertyTypes
          >;
        } & {
          // And nothing else:
          [K in Exclude<
            keyof Self,
            keyof ActiveContext | keyof PropertyTypes | Iri | "@context"
          >]?: never;
        }
    : // /infer ActiveContext
      never;

export type JsonLDDocument<
  PropertyTypes,
  OuterContext extends ContextConstraint,
  Self
> = {
  // This trick ensures Self is inferred to be the entire object this type is
  // applied to, while the resulting type leaves the *values* of those keys as
  // `unknown`.
  [K in keyof Self]: K extends never ? Self[K] : unknown;
} & NoInfer<NodeObject<PropertyTypes, OuterContext, Self>>;
