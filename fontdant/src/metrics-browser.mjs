// The panel's Add a font reads a dropped file with the same code the library build uses (fontkit +
// metrics-core). Bundled by scripts/build.mjs into dist/metrics.js (window.FontdantMetrics), loaded only
// when Add a font opens.
import * as fontkit from 'fontkit';
import { metricsFrom, makeEntry } from './metrics-core.mjs';

function fromBuffer(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const f = fontkit.create(bytes);
  const font = f.fonts ? f.fonts[0] : f;
  return metricsFrom(font);
}
const api = { fromBuffer, makeEntry };
if (typeof window !== 'undefined') window.FontdantMetrics = api;
export default api;
