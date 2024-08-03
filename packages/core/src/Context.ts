export type Iri<
  Prefix extends string = string,
  Suffix extends string = string
> = `${Prefix}:${Suffix}`;

/**
 * A constraint type for Contexts.
 */
// TODO: So far, we only handle string values for Term definitions in @context.
export type ContextConstraint = Record<string, string>;

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

type ExpandedKey<Key extends string, Context extends ContextConstraint> =
  // If the Key is a Prefixed IRI...
  Key extends Iri<infer Prefix, infer Rest>
    ? Prefix extends keyof Context
      ? `${Context[Prefix]}${Rest}`
      : Key
    : Key extends keyof Context
    ? Context[Key]
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
