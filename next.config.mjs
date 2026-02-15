/** @type {import('next').NextConfig} */
import { createRequire } from "module";

function isElementTaggerAvailable() {
  try {
    const require = createRequire(import.meta.url);
    require.resolve("@softgenai/element-tagger");
    return true;
  } catch {
    return false;
  }
}

function getTurboRules() {
  if (!isElementTaggerAvailable()) {
    console.log("[Softgen] Element tagger not found, skipping loader configuration");
    return {};
  }

  return {
    "*.tsx": ["@softgenai/element-tagger"],
    "*.jsx": ["@softgenai/element-tagger"],
  };
}

const nextConfig = {
  reactStrictMode: true,

  // ✅ moved from experimental.turbo -> turbopack
  turbopack: {
    rules: getTurboRules(),
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  allowedDevOrigins: ["*.daytona.work", "*.softgen.dev"],
};

export default nextConfig;