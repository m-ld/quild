export type Iri<
  Prefix extends string = string,
  Suffix extends string = string
> = `${Prefix}:${Suffix}`;

/**
 * A constraint type for Contexts.
 */
export type ContextConstraint = Record<string, string | object>;

export type EmptyContext = Record<never, never>;

export type ContextOf<Doc> = "@context" extends keyof Doc
  ? Doc["@context"] extends ContextConstraint
    ? Doc["@context"]
    : EmptyContext
  : EmptyContext;

/**
 * Given a {@link ParentContext} and a {@link ChildContext} definition, a
 * Context which should be used as the active context for child.
 */
export type PropagatedContext<
  ParentContext extends ContextConstraint,
  ChildContext extends ContextConstraint
> = {
  [Key in
    | keyof ParentContext
    | keyof ChildContext]: Key extends keyof ChildContext
    ? ChildContext[Key]
    : Key extends keyof ParentContext
    ? ParentContext[Key]
    : never;
};

export type ExpandedTerm<
  Context extends ContextConstraint,
  Term extends keyof Context
> = Context[Term] extends string
  ? Context[Term]
  : "@id" extends keyof Context[Term]
  ? Context[Term]["@id"] extends string
    ? Context[Term]["@id"]
    : unknown
  : unknown;

export type ExpandedKey<Key extends string, Context extends ContextConstraint> =
  // If the Key is a Prefixed IRI...
  Key extends Iri<infer Prefix, infer Rest>
    ? ExpandedTerm<Context, Prefix> extends string
      ? `${ExpandedTerm<Context, Prefix>}${Rest}`
      : Key
    : ExpandedTerm<Context, Key> extends string
    ? ExpandedTerm<Context, Key>
    : Context["@vocab"] extends string
    ? `${Context["@vocab"]}${Key}`
    : Key;
/**
 * For the given {@link Key} from a Node Object with the Active Context
 * {@link Context}, get the type of the value of the property it represents.
 */
export type TypeOfPropertyAtKey<
  Key extends string,
  Context extends ContextConstraint,
  PropertyTypes
> = ExpandedKey<Key, Context> extends infer Property
  ? Property extends keyof PropertyTypes
    ? PropertyTypes[Property]
    : unknown
  : never;
