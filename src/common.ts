import { DataFactory } from "rdf-data-factory";
import { Factory as AlgebraFactory } from "sparqlalgebrajs";

export const PLACEHOLDER = "?";

export const df = new DataFactory();
export const af = new AlgebraFactory(df);

export const string = df.namedNode("http://www.w3.org/2001/XMLSchema#string");
export const integer = df.namedNode("http://www.w3.org/2001/XMLSchema#integer");
export const double = df.namedNode("http://www.w3.org/2001/XMLSchema#double");
export const boolean = df.namedNode("http://www.w3.org/2001/XMLSchema#boolean");

export const nil = df.namedNode(
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil"
);
export const first = df.namedNode(
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#first"
);
export const rest = df.namedNode(
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#rest"
);
