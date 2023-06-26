// Graphy's FastDataset has a bug: if .match() matches no triples, reading the
// resulting dataset will never complete, because it's left open for writing to.
// That means trying to query over it will hang forever. FixedFastDataset
// prevents that from happening. This change should be pushed upstream.

import originalDataset from "@graphy/memory.dataset.fast";

const d = originalDataset();
const FastDataset = d.constructor as { new (): typeof d };

class FixedFastDataset extends FastDataset {
  offspring(h_quad_tree = null) {
    return super.offspring(
      h_quad_tree || { [originalDataset.keys]: 0, [originalDataset.quads]: 0 }
    );
  }
}
export const dataset = Object.assign(
  () => new FixedFastDataset(),
  originalDataset
);
