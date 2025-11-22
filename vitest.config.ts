import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["**/__tests__/**/*.test.{ts,tsx,js}", "**/*.spec.{ts,tsx,js}"],
    exclude: ["node_modules","dist",".next","artifacts","tools"],
  },
});
