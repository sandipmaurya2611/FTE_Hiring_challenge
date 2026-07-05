const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // fontkit@2.0.4 ships an empty dist/ folder (missing dist/main.cjs and
    // dist/browser.cjs). @react-pdf/renderer imports it but only calls
    // fontkit.create() for *custom* fonts — never for the built-in fonts
    // (Helvetica, Times-Roman, Courier) that our ReportDocument uses.
    // Aliasing to a stub satisfies webpack on both client and server.
    config.resolve.alias["fontkit"] = path.resolve(__dirname, "fontkit-stub.mjs");

    if (isServer) {
      // Also mark the entire react-pdf stack as external on the server so the
      // stubbed /api/pdf route doesn't try to bundle it.
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        "@react-pdf/renderer",
        "@react-pdf/font",
      ];
    }

    return config;
  },
};

module.exports = nextConfig;
