const withSerwistInit = require("@serwist/next").default;

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});

/** @type {import('next').NextConfig} */
module.exports = withSerwist({});
