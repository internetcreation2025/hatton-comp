import type { NextConfig } from "next";

// Shared across our apps — see security-headers.mjs.
import { securityHeaders } from "./security-headers.mjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    // Nothing third-party is loaded by this app, so the defaults are enough.
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};

export default nextConfig;
