/**
 * @jest-environment jsdom
 */

import { describe, it, expect } from "@jest/globals";
import { clone, uuid } from "@m-ld/m-ld";
import { NullRemotes } from "@m-ld/m-ld/ext/null";
import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryLevel } from "memory-level";

import { useMeldQuery } from "./useMeldQuery";

const createMeldClone = async () =>
  clone(new MemoryLevel(), NullRemotes, {
    "@id": uuid(),
    "@domain": "directory.example.edu",
    genesis: true,
    logLevel: "WARN",
  });

const query = {
  "@context": { "@vocab": "http://schema.org/" },
  "@graph": [{ name: "?" }],
} as const;

describe(useMeldQuery, () => {
  it("begins with `data` and `parseWarnings` `undefined`", async () => {
    const meld = await createMeldClone();

    const { result } = renderHook(() => useMeldQuery(meld, query));

    expect(result.current).toStrictEqual({
      data: undefined,
      parseWarnings: undefined,
    });
  });

  it("reacts to updates", async () => {
    const meld = await createMeldClone();

    const { result } = renderHook(() => useMeldQuery(meld, query));

    await act(async () => {
      await meld.write({
        "@context": { "@vocab": "http://schema.org/" },
        "@type": "Person",
        name: "Jane Doe",
        jobTitle: "Professor",
        telephone: "(425) 123-4567",
        url: "http://www.janedoe.com",
      });
    });

    await waitFor(
      () => {
        expect(result.current).toStrictEqual({
          data: {
            "@context": { "@vocab": "http://schema.org/" },
            "@graph": [{ name: "Jane Doe" }],
          },
          parseWarnings: [],
        });
      },
      { timeout: 100 }
    );

    await act(async () => {
      await meld.write({
        "@context": { "@vocab": "http://schema.org/" },
        "@type": "Person",
        name: "Joe Schmo",
        jobTitle: "Associate Professor",
        telephone: "(291) 102-3313",
        url: "http://www.joeschmo.net",
      });
    });

    await waitFor(
      () => {
        expect(result.current).toStrictEqual({
          data: {
            "@context": { "@vocab": "http://schema.org/" },
            "@graph": [{ name: "Jane Doe" }, { name: "Joe Schmo" }],
          },
          parseWarnings: [],
        });
      },
      { timeout: 100 }
    );
  });
});
