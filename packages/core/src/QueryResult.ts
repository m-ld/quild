// Some terminology used in this file, derived from JSON-LD:
//
// - An "IRI" is a string which may contain a colon.
//
// - A "Prefixed IRI" is an IRI which contains a colon. The portion before the
//   colon is called the "Prefix" in these types--in JSON-LD, it is only a
//   prefix if it is a compact IRI, but we often don't know that in places where
//   we need to name it, so we always call it a "Prefix".
//
// - An "Absolute IRI" is a Prefixed IRI which needs no further expansion.
//
// - A "Compact IRI" is an IRI which has a prefix which is a Term. It is not
//   possible to know whether an IRI is Absolute or Compact without a Context to
//   provide Term defintitions.
//
// - A "Term" is a string which can be expanded to a full IRI using a Context.
//   It is never an IRI itself--that is, it never contains a colon.
//
// - A "Relative IRI" is an IRI which does not contain a colon. In IRI value
//   positions, it is resolved relative to the Base IRI (as set with `@base`).
//   In IRI Term positions, it is resolved relative to the vocabulary mapping
//   (as set with `@vocab`). It is not possible to know whether a
//   vocabulary-mapped string without a colon is a Relative IRI or a Term
//   without a Context to provide Term definitions.
//
// - A "Key" is any key of some concrete, actual object. In a Node Object, a Key
//   is either an Absolute IRI, a Compact IRI, a Term valid in the active
//   Context a Keyword (like "@context"), a Relative IRI, or ignored by the
//   algorithm. If it contains a colon, if its prefix is a Term in the active
//   Context, it is expanded as a Compact IRI; otherwise, it is an Absolute IRI.
//   If it does not contain a colon, if it is a Term in the active Context, it
//   is expanded as a Term; otherwise, if there is a vocabulary mapping, it is
//   resolved relative to that; or, failing all of that, it is ignored.

import type {
  ContextConstraint,
  ContextOf,
  EmptyContext,
  PropagatedContext,
  TypeOfPropertyAtKey,
} from "./Context";

type Placeholder = "?";

type NodeObjectResult<
  Query,
  PropertyTypes,
  ParentContext extends ContextConstraint = EmptyContext
> = PropagatedContext<ParentContext, ContextOf<Query>> extends infer Context
  ? // Context always extends ContextConstraint already, but TypeScript
    // doesn't know that here.
    Context extends ContextConstraint
    ? {
        [Key in keyof Query & string]: Key extends "@context"
          ? // Preserve the "@context" definition.
            Query[Key]
          : // If the value is a Placeholder, fill it in with the type of the
          // property the key represents.
          Query[Key] extends Placeholder
          ? TypeOfPropertyAtKey<Key, Context, PropertyTypes>
          : Query[Key] extends readonly [infer ArraySubquery]
          ? Array<NodeObjectResult<
              ArraySubquery,
              PropertyTypes,
              Context
            > | null>
          : Query[Key] extends object
          ? NodeObjectResult<Query[Key], PropertyTypes, Context>
          : // Otherwise, preserve it as a known literal.
            Query[Key];
      }
    : never
  : never;

export type QueryResult<
  Query,
  PropertyTypes,
  Context extends ContextConstraint = EmptyContext
> = Query extends readonly [infer ArraySubquery]
  ? Array<NodeObjectResult<ArraySubquery, PropertyTypes, Context> | null>
  : NodeObjectResult<Query, PropertyTypes, Context> | null;
