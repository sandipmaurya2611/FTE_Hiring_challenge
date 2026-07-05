/**
 * fontkit stub — replaces the broken fontkit@2.0.4 npm package whose dist/
 * folder is empty (missing dist/main.cjs and dist/browser.cjs).
 *
 * @react-pdf/renderer only calls fontkit.create() when loading *custom* fonts
 * via Font.register(). Our ReportDocument uses only built-in PDF fonts
 * (Helvetica, Helvetica-Bold), so fontkit.create() is never invoked at
 * runtime. This stub satisfies the import so webpack can build successfully.
 */

export function create(data, postscriptName) {
  // This is only reached when a custom font URL/data-URL is loaded.
  // Our app only uses built-in fonts so this path is never hit.
  throw new Error(
    "fontkit.create() was called but fontkit is stubbed. " +
    "Only built-in PDF fonts (Helvetica, Times-Roman, Courier) are supported."
  );
}

export default { create };
