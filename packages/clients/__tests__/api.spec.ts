import { vi, expect, it, beforeEach, describe } from "vitest";
import { apiFetch } from "../http/api";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds csrf token and retries GET", async () => {
    (globalThis as unknown as { document: { cookie: string } }).document = {
      cookie: "csrf_token=token123",
    };
    const json = () => Promise.resolve({ ok: true });
    const res = { ok: true, headers: new Headers({ "content-type": "application/json" }), json };
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue(res);
    (globalThis as unknown as { fetch: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;

    const out = await apiFetch("/test");
    expect(out).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers["x-csrf-token"]).toBe("token123");
  });
});
