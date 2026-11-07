const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}

const originalEnhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) => {
  const enhancedMiddleware = originalEnhanceMiddleware
    ? originalEnhanceMiddleware(middleware, server)
    : middleware;

  return (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");

    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

    return enhancedMiddleware(req, res, next);
  };
};

module.exports = config;
