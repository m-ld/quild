// Some JSON-LD terminology, for clarity:
//
// - An "IRI" is a string which contains a colon. The portion before the colon
//   is called the "Prefix" in these types--in JSON-LD, it is only a prefix if
//   it is a compact IRI, but we often don't know that in places where we need
//   to name it, so we always call it a "Prefix".
//
// - An "Absolute IRI" is an IRI which needs no further expansion. It is not
//   possible to know whether an IRI is absolute without a Context.
//
// - A "Compact IRI" is an IRI which has a prefix which is a Term.
//
// - A "Term" is a string which can be expanded to a full IRI using a Context.
//   It is never an IRI itself--that is, it never contains a colon.
//
// - A "Key" is any key of some concrete, actual object. In a Node Object, a Key
//   is either an absolute IRI, a compact IRI, a Term valid in the active
//   Context a Keyword (like "@context"), or ignored by the algorithm.

type Placeholder = "?";

type ContextOf<Query> = "@context" extends keyof Query
  ? Query["@context"]
  : object;

type ExpandedTerm<Term, Context> = Term extends keyof Context
  ? Context[Term]
  : Term;

type TypeOfProperty<Key, Context, PropertyTypes> = ExpandedTerm<
  Key,
  Context
> extends infer Property
  ? Property extends keyof PropertyTypes
    ? PropertyTypes[Property]
    : unknown
  : never;

export type QueryResult<Query, PropertyTypes> =
  ContextOf<Query> extends infer Context
    ? {
        [Key in keyof Query]: Query[Key] extends Placeholder
          ? TypeOfProperty<Key, Context, PropertyTypes>
          : Query[Key];
      }
    : never;
