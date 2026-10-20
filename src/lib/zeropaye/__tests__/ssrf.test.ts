// Unit tests for SSRF guard (security.ts)
// v4.0: tests bracket stripping, net.isIP, private IP ranges

import { describe, it, expect } from "vitest";
import { isSsrfSafe, isSsrfSafeAsync } from "../security";

describe("SSRF guard — sync (isSsrfSafe)", () => {
  it("blocks private IPv4 literals", () => {
    expect(isSsrfSafe("http://127.0.0.1:3000/hook")).toBe(false);
    expect(isSsrfSafe("http://10.0.0.5/hook")).toBe(false);
    expect(isSsrfSafe("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isSsrfSafe("http://192.168.1.1/hook")).toBe(false);
    expect(isSsrfSafe("http://172.16.0.1/hook")).toBe(false);
  });

  it("blocks metadata hostnames", () => {
    expect(isSsrfSafe("http://metadata.google.internal")).toBe(false);
    expect(isSsrfSafe("http://169.254.169.254")).toBe(false);
  });

  it("allows public IPs in dev mode", () => {
    expect(isSsrfSafe("http://8.8.8.8/hook")).toBe(true);
  });

  it("allows hostnames in dev mode (sync doesn't resolve DNS)", () => {
    expect(isSsrfSafe("http://example.com/hook")).toBe(true);
  });

  it("allows localhost in dev mode", () => {
    expect(isSsrfSafe("http://localhost:3000/hook", true)).toBe(true);
    expect(isSsrfSafe("http://127.0.0.1:3000/hook", true)).toBe(true);
  });

  it("rejects non-HTTP protocols", () => {
    expect(isSsrfSafe("ftp://example.com/hook")).toBe(false);
    expect(isSsrfSafe("file:///etc/passwd")).toBe(false);
  });
});

describe("SSRF guard — async (isSsrfSafeAsync)", () => {
  it("blocks [::1] bracketed IPv6 (POC3 fix)", async () => {
    // new URL("https://[::1]/").hostname = "[::1]" — brackets must be stripped
    const result = await isSsrfSafeAsync("https://[::1]/hook");
    expect(result).toBe(false);
  });

  it("blocks private IPv4 literals", async () => {
    expect(await isSsrfSafeAsync("http://127.0.0.1/hook")).toBe(false);
    expect(await isSsrfSafeAsync("http://10.0.0.5/hook")).toBe(false);
    expect(await isSsrfSafeAsync("http://169.254.169.254/hook")).toBe(false);
    expect(await isSsrfSafeAsync("http://192.168.1.1/hook")).toBe(false);
  });

  it("allows public IPs", async () => {
    expect(await isSsrfSafeAsync("http://8.8.8.8/hook")).toBe(true);
  });

  it("allows localhost in dev mode", async () => {
    expect(await isSsrfSafeAsync("http://localhost:3000/hook", true)).toBe(true);
  });
});
