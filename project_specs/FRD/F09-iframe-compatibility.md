
---

## F09: Iframe Compatibility & Port Binding

**Description:** The QuickNotes application must render correctly when embedded inside a parent iframe (potentially cross-origin) and must be reachable from container networking and the preview host. This requires: binding the HTTP server to `0.0.0.0:3000` rather than `localhost`; omitting any HTTP response headers that block iframe embedding (`X-Frame-Options`, restrictive `frame-ancestors` CSP); and using `next.config.mjs` (never `next.config.ts`, which causes a hard error in Next.js 14).

**Terminology:**
- **`0.0.0.0`:** Wildcard bind address — accepts connections on all network interfaces, making the server reachable from outside the container
- **`X-Frame-Options`:** HTTP response header (`DENY` or `SAMEORIGIN`) that prevents browsers from rendering the page inside a `<frame>` or `<iframe>`
- **`frame-ancestors`:** CSP directive that restricts which origins may embed the page in a frame; `'none'` or `'self'` would block cross-origin iframe embedding
- **`next.config.mjs`:** ES Module format Next.js config file; the only format that works in Next.js 14 (`.ts` causes a hard startup error; `.js` is also acceptable)

**Sub-features:**
- Server bound to `0.0.0.0:3000`
- No `X-Frame-Options` header emitted
- No `frame-ancestors 'none'` or `frame-ancestors 'self'` CSP directive
- Config file is `next.config.mjs` (or `.js`) — never `.ts`

**Process:**
1. Next.js server starts and binds to `0.0.0.0:3000`.
2. For every HTTP response, the server must **not** include the `X-Frame-Options` header.
3. If a `Content-Security-Policy` header is present, it must **not** contain `frame-ancestors 'none'` or `frame-ancestors 'self'`. Omitting the `frame-ancestors` directive entirely is acceptable.
4. The Next.js configuration file is `next.config.mjs` (ES Module format) or `next.config.js` (CommonJS format). A file named `next.config.ts` must not exist in the project root.
5. The preview host embeds the app in a `<iframe src="http://host:3000">` — the page must render without a `SecurityError`, blank iframe, or browser console frame-blocking warnings.

**Inputs:**
- `PORT` environment variable (optional): if provided, the server may use it; default must be `3000`
- `next.config.mjs` file: must exist; controls Next.js headers configuration

**Outputs:**
- HTTP server listening on `0.0.0.0:3000`
- HTTP responses contain no `X-Frame-Options` header
- HTTP responses contain no `frame-ancestors 'none'` or `frame-ancestors 'self'` in CSP
- Application renders inside a cross-origin `<iframe>` without errors

**Validation:**
- `next.config.mjs` (or `.js`) must exist at the project root; `next.config.ts` must not exist
- The `headers()` export in `next.config.mjs`, if present, must not add `X-Frame-Options` to any route
- Default Next.js headers must be audited: as of Next.js 14, the framework does not add `X-Frame-Options` by default, but custom headers must not introduce it
- Server port: `3000` is the default; binding to `127.0.0.1` or `localhost` only would fail in container environments

**Error States:**

| Scenario | Consequence | Mitigation |
|----------|-------------|------------|
| `next.config.ts` present in project root | Hard startup error: Next.js 14 refuses to parse TS config | Use `next.config.mjs` only; CI check for `.ts` config |
| `X-Frame-Options: DENY` header emitted | iframe renders blank; browser console shows frame-blocked error | Remove from headers config; add CI smoke test |
| `frame-ancestors 'none'` or `'self'` in CSP | Same as X-Frame-Options: DENY | Exclude from CSP; add CI smoke test |
| Server bound to `127.0.0.1` only | Unreachable from container network / preview host | Verify `0.0.0.0` binding in startup smoke test |

**API Surface (this feature):** None — this feature is about server configuration, not API behaviour.

**Schema Surface (this feature):** None.

---
