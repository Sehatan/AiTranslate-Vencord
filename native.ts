/*
 * Native HTTP bridge for AiTranslate.
 *
 * API calls are made from Electron's main process so provider CORS policies do
 * not block requests from Discord's renderer. The bridge is deliberately narrow:
 * only POST requests to a /chat/completions endpoint on a known provider host
 * (or loopback for local servers) are allowed. This prevents the renderer from
 * using the native process as a general-purpose fetch/SSRF proxy.
 */

const ALLOWED_HOSTS = new Set([
    "api.openai.com",
    "openrouter.ai",
    "api.groq.com",
    "api.together.xyz",
    "api.mistral.ai",
    "api.deepseek.com",
    "api.x.ai",
    "api.cerebras.ai",
    "api.fireworks.ai"
]);

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const ALLOWED_HEADERS = new Set(["authorization", "content-type", "accept"]);

export interface NativeRequestOptions {
    url: string;
    headers?: Record<string, string>;
    body: string;
}

export interface NativeResponse {
    ok: boolean;
    status: number;
    statusText: string;
    body: string;
}

function assertAllowedUrl(url: URL) {
    if (url.protocol !== "http:" && url.protocol !== "https:")
        throw new Error("Only HTTP and HTTPS API URLs are supported.");

    if (url.username || url.password)
        throw new Error("API URLs must not contain credentials.");

    const host = url.hostname.toLowerCase();
    const loopback = LOOPBACK_HOSTS.has(host);

    if (!loopback && !ALLOWED_HOSTS.has(host))
        throw new Error(`The host "${host}" is not allowed by the AiTranslate native bridge.`);

    if (!loopback && url.protocol !== "https:")
        throw new Error("Remote API hosts must use HTTPS.");

    if (!loopback && url.port && url.port !== "443" && url.port !== "80")
        throw new Error("Remote API hosts must use their standard HTTPS port.");

    if (!/\/chat\/completions\/?$/i.test(url.pathname))
        throw new Error("The native bridge only accepts /chat/completions endpoints.");
}

export async function request(_event: any, options: NativeRequestOptions): Promise<NativeResponse> {
    if (!options || typeof options.url !== "string" || typeof options.body !== "string")
        throw new Error("Invalid API request.");

    const url = new URL(options.url);
    assertAllowedUrl(url);

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(options.headers ?? {})) {
        if (typeof value === "string" && ALLOWED_HEADERS.has(key.toLowerCase()))
            headers[key] = value;
    }

    const res = await fetch(url, {
        method: "POST",
        headers,
        body: options.body,
        redirect: "error",
        signal: AbortSignal.timeout(300_000)
    });

    const body = await res.text();
    if (body.length > 2_000_000)
        throw new Error("API response was too large.");

    return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        body
    };
}
