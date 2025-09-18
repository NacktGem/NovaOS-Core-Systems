import { describe, expect, it } from "vitest";
import config from "../next.config";

describe("novaos env config", () => {
  it("exposes required environment bindings", () => {
    const env = (config as { env?: Record<string, unknown> }).env ?? {};
    const requiredKeys = [
      "CORE_API_BASE",
      "NEXT_PUBLIC_CORE_API_URL",
      "NEXT_PUBLIC_ECHO_WS_URL",
      "ECHO_WS",
      "SITE_URL",
      "NOVAOS_BASE_URL",
    ];

    for (const key of requiredKeys) {
      expect(env[key]).toBeDefined();
    }
  });
});
