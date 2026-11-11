// Reads the metrics fontdant needs from any font file (TTF, OTF, WOFF, WOFF2) with fontkit.
// This is the "bring your own font" entry point: a client's typeface becomes a font entry
// through exactly this function, no code change. The browser twin is metrics-browser.mjs.
import { readFileSync } from 'node:fs';
import * as fontkit from 'fontkit';
import { metricsFrom, makeEntry } from './metrics-core.mjs';
export { metricsFrom, makeEntry };

export function metricsFromFile(path) {
  const buf = readFileSync(path);
  const f = fontkit.create(buf);
  const font = f.fonts ? f.fonts[0] : f;   // a collection → first face
  return metricsFrom(font);
}
