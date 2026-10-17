/*
 * Native HTTP bridge for AiTranslate.
 *
 * API calls are made from Electron's main process so provider CORS policies do
 * not block requests from Discord's renderer. Only HTTP(S) POST requests are
 * allowed, and the response body is returned as text so the renderer can parse
 * it. The renderer is still responsible for choosing the configured API URL.
 */

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

export async function request(_event: any, options: NativeRequestOptions): Promise<NativeResponse> {
    if (!options || typeof options.url !== "string" || typeof options.body !== "string")
        throw new Error("Invalid API request.");

    const url = new URL(options.url);
    if (url.protocol !== "http:" && url.protocol !== "https:")
        throw new Error("Only HTTP and HTTPS API URLs are supported.");

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(options.headers ?? {})) {
        if (typeof value === "string")
            headers[key] = value;
    }

    const res = await fetch(url, {
        method: "POST",
        headers,
        body: options.body,
        signal: AbortSignal.timeout(300_000)
    });

    return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        body: await res.text()
    };
}
