# 🦔 Quild — Queries in Linked Data

**Quild** is a query language for building JSON-LD documents from RDF-style data sources, such as [JSON-LD](https://json-ld.org/), [RDF stores](https://rdf.js.org/), or [m-ld](https://m-ld.org/). It's a little like if [JSON-LD Framing](https://www.w3.org/TR/json-ld11-framing/) and [GraphQL](https://graphql.org/) had a happy little baby together.

Just ask this…

```json
{
  "@context": {
    "@base": "https://swapi.dev/api/",
    "@vocab": "http://swapi.dev/documentation#"
  },
  "@graph": [
    {
      "@id": "?",
      "@type": "Person",
      "name": "?",
      "eye_color": "blue",
      "films": [{ "title": "?" }]
    }
  ]
}
```

…to get this:

```json
{
  "@context": {
    "@base": "https://swapi.dev/api/",
    "@vocab": "http://swapi.dev/documentation#"
  },
  "@graph": [
    {
      "@id": "people/1/",
      "@type": "Person",
      "name": "Luke Skywalker",
      "eye_color": "blue",
      "films": [
        { "title": "A New Hope" },
        { "title": "The Empire Strikes Back" },
        { "title": "Return of the Jedi" },
        { "title": "Revenge of the Sith" }
      ]
    },
    {
      "@id": "people/6/",
      "@type": "Person",
      "name": "Owen Lars",
      "eye_color": "blue",
      "films": [
        { "title": "A New Hope" },
        { "title": "Attack of the Clones" },
        { "title": "Revenge of the Sith" }
      ]
    }
  ]
}
```

_The examples in this document, as well as most of the tests in this repo, use data from the ever-fantastic [SWAPI](https://swapi.dev/), the Star Wars API. SWAPI is a non-linked-data JSON REST API; we interpret it here using a custom [context](packages/core/fixtures/context.json)._

## 🔍 Queries

Queries in Quild follow a few simple rules that make them intuitive to work with:

### 📐 Shape

The result of a Quild query always has the same shape as the query that generated it.

- When an object appears in the query, it appears in the result with all of the same keys, and the values applied as a subquery.
- When an array appears in the query, it appears in the result as an array. Arrays in queries generally contain exactly one object---a subquery to match---but can have any number of matching objects in the result, even 0.
- When a literal value appears in the query, it appears in the result.
- When a `"?"` appears in the query, it's replaced by an actual matching value in the result.

This means that, unlike GraphQL, the shape of the result is extremely easy to predict given the query.

### 💡 Semantics

- The result of a Quild query is a valid JSON-LD document.
- The query itself is also a valid JSON-LD document, because it has the same shape.
- The meaning of the keys in the query and the result are specified by the context, according to normal JSON-LD rules.
- When interpreted as JSON-LD, the result contains some subset of the facts in the original data. That is, in RDF terms, every triple contained in the result is a triple found in the original data.
- Queries and results may have additional `@`-prefixed keyword keys which are not defined in JSON-LD, for additional features. JSON-LD ignores these keys, so they can represent computed values not present as explicit statements in the original data. (No such keywords have been implemented so far, but they're reserved for now as a possibility.)

## 🔌 API

The Quild libraries offer a few ways to work with queries over datasets:

### `@quild/core`

The most basic API available is in `@quild/core`. `readQuery` makes a single query over an RDF source (such as a [m-ld clone](https://js.m-ld.org/), [Quadstore](https://github.com/jacoscaz/quadstore/) instance, or [N3 store](https://rdf.js.org/N3.js/docs/N3Store.html)).

```ts
const source: RDF.Source = swapiData();

const queryResult = await readQuery(source, {
  "@context": {
    "@base": "https://swapi.dev/api/",
    "@vocab": "http://swapi.dev/documentation#",
  },
  "@id": "people/1/",
  name: "?",
  films: [{ title: "?" }],
});
```

```json
{
  "parseWarnings": [],
  "data": {
    "@context": {
      "@base": "https://swapi.dev/api/",
      "@vocab": "http://swapi.dev/documentation#"
    },
    "@id": "people/1/",
    "name": "Luke Skywalker",
    "films": [
      { "title": "A New Hope" },
      { "title": "The Empire Strikes Back" },
      { "title": "Return of the Jedi" },
      { "title": "Revenge of the Sith" }
    ]
  }
}
```

### `@quild/observable`

Making a single query is fine, but what about _live_ data? `@quild/observable` lets you react in real time to changes in the underlying data by providing an observable stream of query results.

Currently, this package only works with m-ld, which is able to signal that data has changed. The intention is to make this more broadly available, but as there's no standard way to signal data changes in the [RDF.js](https://rdf.js.org/) ecosystem, it requires further thought.

```ts
const meld: MeldClone = cloneWithSwapiData();

observeMeldQuery(meld, {
  "@context": {
    "@base": "https://swapi.dev/api/",
    "@vocab": "http://swapi.dev/documentation#",
  },
  "@id": "people/16/",
  name: "?",
  films: [{ title: "?" }],
}).subscribe({ data } => {
  console.log(data)
});

// Then...
await meld.write({
  "@delete": {
    "@id": "https://swapi.dev/api/people/16/"
    "films": { "@id": "https://swapi.dev/api/films/1/" }
  }
})
```

```json
{
  "@context": {
    "@base": "https://swapi.dev/api/",
    "@vocab": "http://swapi.dev/documentation#"
  },
  "@id": "people/16/",
  "name": "Jabba Desilijic Tiure",
  "films": [
    { "title": "A New Hope" },
    { "title": "Return of the Jedi" },
    { "title": "The Phantom Menace" }
  ]
}

// Then...
{
  "@context": {
    "@base": "https://swapi.dev/api/",
    "@vocab": "http://swapi.dev/documentation#"
  },
  "@id": "people/16/",
  "name": "Jabba Desilijic Tiure",
  "films": [
    { "title": "Return of the Jedi" },
    { "title": "The Phantom Menace" }
  ]
}
```

### `@quild/react`

Finally, if you're using React and want to have live data updates too, you can use `@quild/react`, which is nothing more than a simple hook wrapper, `useMeldQuery()`, around `observeMeldQuery()`:

```tsx
export function Person({ id }) {
  // Here, we're providing the m-ld clone through a React context.
  const meld = useMeld();

  // useMeldQuery will resubscribe to the query if it changes, so we don't want
  // to recreate the query object on every render, only if `id` changes.
  const query = useMemo(
    () => ({
      "@context": {
        "@base": "https://swapi.dev/api/",
        "@vocab": "http://swapi.dev/documentation#",
      },
      "@id": id,
      name: "?",
      films: [
        {
          "@id": "?",
          title: "?",
        },
      ],
    }),
    [id]
  );

  const { data: person } = useMeldQuery(meld, query);

  return (
    <div>
      <strong>{person.name}</strong> was in:
      <ul>
        {person.films.map((film) => (
          <li key={film["@id"]}>
            <a href={film["@id"]}>{film.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Then...
await meld.write({
  "@delete": {
    "@id": "https://swapi.dev/api/people/16/"
    "films": { "@id": "https://swapi.dev/api/films/1/" }
  }
})
```

> **Jabba Desilijic Tiure** was in:
>
> - [A New Hope](https://swapi.dev/api/films/1/)
> - [Return of the Jedi](https://swapi.dev/api/films/3/)
> - [The Phantom Menace](https://swapi.dev/api/films/4/)

Then…

> **Jabba Desilijic Tiure** was in:
>
> - [Return of the Jedi](https://swapi.dev/api/films/3/)
> - [The Phantom Menace](https://swapi.dev/api/films/4/)

## ▶️ Examples

To run the examples, check out the repo and run:

```sh
$ pnpm install
$ pnpm examples
```

The apps should both build and open in your browser. You'll see two different copies of the [TodoMVC](https://todomvc.com/) app: one using vanilla JavaScript (ES6), and one using React, both modified to use m-ld and Quild. You'll also see a text box at the bottom of the page. Each copy of the app will connect to the [m-ld Gateway](https://gw.m-ld.org/) and start using a new domain. You can connect the two apps by copying the domain name from one app and pasting it in the other app's box.

Try running several copies, and watch them stay in sync! Have a friend run it on their machine and give them the domain name! Try going offline and making changes in multiple windows: you'll see your changes locally in each window, and when you go back online, you'll see them merge automatically!
