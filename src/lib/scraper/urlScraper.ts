import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";

export interface ScrapeResult {
  success: boolean;
  text?: string;
  title?: string;
  sourceUrl?: string;
  error?: string;
  advice?: string;
}

const MAX_SIZE_BYTES = 1024 * 1024; // 1 MB limit
const TIMEOUT_MS = 5000; // 5-second strict timeout

/**
 * Validates IPv4 address against private, loopback, link-local, and reserved ranges.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IPv4 is treated as unsafe
  }
  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;
  // 100.64.0.0/10 (Shared address space / Carrier-grade NAT: 100.64.0.0 - 100.127.255.255)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (Link-local, AWS/GCP/Azure instance metadata)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private network: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.0.0.0/24 (IETF protocol assignments)
  if (a === 192 && b === 0 && c === 0) return true;
  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && c === 2) return true;
  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;
  // 198.18.0.0/15 (Benchmark network: 198.18.0.0 - 198.19.255.255)
  if (a === 198 && (b === 18 || b === 19)) return true;
  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && c === 100) return true;
  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && c === 113) return true;
  // 224.0.0.0/4 (Multicast: 224 - 239)
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 (Reserved / Future use: 240 - 255)
  if (a >= 240) return true;

  return false;
}

/**
 * Validates IPv6 address against loopback, link-local, unique local, and IPv4-mapped ranges.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:192.168.1.1)
  if (normalized.startsWith("::ffff:")) {
    const v4Part = normalized.replace("::ffff:", "");
    if (v4Part.includes(".")) {
      return isPrivateOrReservedIPv4(v4Part);
    }
  }

  // Loopback (::1) and unspecified (::)
  if (normalized === "::1" || normalized === "::") return true;

  // Link-local: fe80::/10 (fe80 through febf)
  if (
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  ) {
    return true;
  }

  // Unique local address: fc00::/7 (fc00 through fdff)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }

  return false;
}

/**
 * Checks if an IP string (v4 or v6) belongs to any private or reserved address block.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIP(ip) === 0) {
    return false;
  }
  if (ip.includes(":")) {
    return isPrivateOrReservedIPv6(ip);
  }
  return isPrivateOrReservedIPv4(ip);
}

export interface UrlValidationResult {
  valid: boolean;
  url?: URL;
  error?: string;
  pinnedIp?: string;
}

/**
 * Resolves hostname with an AbortSignal so DNS resolution is bounded by total timeout.
 */
async function lookupWithSignal(
  hostname: string,
  options: dns.LookupAllOptions,
  signal?: AbortSignal
): Promise<dns.LookupAddress[]> {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted", "AbortError");
  }
  return new Promise<dns.LookupAddress[]>((resolve, reject) => {
    let settled = false;
    const onAbort = () => {
      if (settled) return;
      settled = true;
      reject(new DOMException("The operation was aborted", "AbortError"));
    };
    if (signal) {
      signal.addEventListener("abort", onAbort, { once: true });
    }

    dns.lookup(hostname, options, (err, addresses) => {
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
      if (settled) return;
      settled = true;
      if (err) {
        return reject(err);
      }
      resolve(addresses as dns.LookupAddress[]);
    });
  });
}

/**
 * Validates URL syntax and performs strict SSRF pre-flight validation.
 * Returns the verified public pinnedIp to prevent DNS rebinding.
 */
export async function validateJobUrl(
  urlStr: string,
  signal?: AbortSignal
): Promise<UrlValidationResult> {
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted", "AbortError");
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr.trim());
  } catch {
    return {
      valid: false,
      error: "Invalid URL format. Please provide a valid HTTP or HTTPS URL (e.g., https://example.com/job).",
    };
  }

  // Strict protocol check: only http and https allowed
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      valid: false,
      error: `Protocol "${parsed.protocol}" is not permitted. Only HTTP and HTTPS are supported.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Disallow forbidden internal hostnames
  const forbiddenHostnames = [
    "localhost",
    "metadata.google.internal",
    "instance-data",
    "metadata",
  ];

  if (
    forbiddenHostnames.includes(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".lan") ||
    hostname.endsWith(".home.arpa")
  ) {
    return {
      valid: false,
      error: "Access to localhost, internal hosts, and cloud metadata is blocked (SSRF protection).",
    };
  }

  let pinnedIp: string;

  // Check if hostname is directly an IP literal
  if (net.isIP(hostname) !== 0) {
    if (isPrivateOrReservedIp(hostname)) {
      return {
        valid: false,
        error: "Access to private or reserved IP addresses is blocked (SSRF protection).",
      };
    }
    pinnedIp = hostname;
  } else {
    // DNS pre-resolution check to prevent DNS rebinding or internal DNS aliases
    try {
      const lookupResults = await lookupWithSignal(hostname, { all: true }, signal);
      if (!lookupResults || lookupResults.length === 0) {
        return {
          valid: false,
          error: `Could not resolve hostname "${hostname}". Please check the URL.`,
        };
      }

      for (const record of lookupResults) {
        if (isPrivateOrReservedIp(record.address)) {
          return {
            valid: false,
            error: `Target hostname resolves to private/reserved IP (${record.address}). Request blocked for SSRF protection.`,
          };
        }
      }
      pinnedIp = lookupResults[0].address;
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === "AbortError" || err.message.includes("aborted"))) {
        throw err;
      }
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        valid: false,
        error: `DNS resolution failed for "${hostname}": ${errMsg}`,
      };
    }
  }

  return { valid: true, url: parsed, pinnedIp };
}

/**
 * Decodes common HTML entities into readable plain text.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&bull;/g, "•")
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return "";
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return "";
      }
    });
}

/**
 * Strips markup, scripts, and navigation clutter from raw HTML,
 * extracting clean, readable job description text and title.
 */
export function extractReadableText(html: string): { title: string; text: string } {
  // Extract document title before stripping
  let title = "";
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = decodeHtmlEntities(titleMatch[1].trim());
  }

  // Remove non-content tags and their nested contents
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, "");

  // Convert structural tags to text formatting
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/section>/gi, "\n\n")
    .replace(/<\/article>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<h[1-6][^>]*>/gi, "\n\n### ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " ");

  // Strip all remaining tags
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);

  // Split lines, trim each, and normalize whitespace
  const lines = cleaned.split("\n");
  const filteredLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (filteredLines.length > 0 && filteredLines[filteredLines.length - 1] !== "") {
        filteredLines.push("");
      }
      continue;
    }

    // Filter out common boilerplate lines
    const lower = line.toLowerCase();
    if (
      lower.includes("accept all cookies") ||
      lower.includes("we use cookies") ||
      lower.includes("manage cookie preferences") ||
      lower === "privacy policy" ||
      lower === "terms of service"
    ) {
      continue;
    }

    filteredLines.push(line);
  }

  const resultText = filteredLines.join("\n").trim();
  return { title, text: resultText };
}

/**
 * Detects anti-bot screens, CAPTCHAs, or authentication walls.
 */
export function detectAntiBotWall(
  status: number,
  html: string,
  extractedText: string
): { isBlocked: boolean; reason?: string } {
  if (status === 401 || status === 403 || status === 429) {
    return {
      isBlocked: true,
      reason: `Remote server returned HTTP ${status} (Access Denied or Rate Limited).`,
    };
  }

  const lowerHtml = html.toLowerCase();
  const lowerText = extractedText.toLowerCase();

  const botPatterns = [
    "attention required! | cloudflare",
    "just a moment...",
    "verify you are human",
    "verify you are a human",
    "checking your browser",
    "enable javascript and cookies to continue",
    "please enable javascript",
    "sign in to linkedin",
    "join linkedin",
    "sign in to see more",
    "log in to view",
    "access to this page has been denied",
    "perimeterx",
    "datadome",
    "cf-chl-bypass",
  ];

  for (const pattern of botPatterns) {
    if (lowerHtml.includes(pattern) || lowerText.includes(pattern)) {
      return {
        isBlocked: true,
        reason: `Target site is protected by an anti-bot or authentication wall (${pattern}).`,
      };
    }
  }

  if (extractedText.trim().length < 80) {
    return {
      isBlocked: true,
      reason: "Extracted job description is empty or too short (<80 characters). Page may require client-side JavaScript.",
    };
  }

  return { isBlocked: false };
}

/**
 * Performs a network request with DNS pinned strictly to the verified public IP.
 * Guarantees zero SSRF DNS rebinding and streams chunks with strict byte limit.
 */
function fetchPinned(
  targetUrl: URL,
  pinnedIp: string,
  signal: AbortSignal,
  headers: Record<string, string>
): Promise<{
  status: number;
  headers: { get: (name: string) => string | null };
  body: string;
}> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      return reject(new DOMException("The operation was aborted", "AbortError"));
    }

    // Double-check pinned IP restriction at connection boundary
    if (isPrivateOrReservedIp(pinnedIp)) {
      return reject(new Error(`SSRF protection: pinned IP (${pinnedIp}) is restricted.`));
    }

    const isHttps = targetUrl.protocol === "https:";
    const transport = isHttps ? https : http;
    const defaultPort = isHttps ? 443 : 80;
    const port = targetUrl.port ? parseInt(targetUrl.port, 10) : defaultPort;

    const reqOptions: http.RequestOptions = {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port,
      path: (targetUrl.pathname || "/") + (targetUrl.search || ""),
      method: "GET",
      headers: {
        ...headers,
        Host: targetUrl.host,
      },
      // Hard-pin DNS resolution to the pre-validated public IP address
      // eliminating the SSRF DNS rebinding race condition entirely
      lookup: (_hostname, options, cb) => {
        if (isPrivateOrReservedIp(pinnedIp)) {
          return cb(new Error("SSRF blocked: pinned IP is private/reserved"), "", 4);
        }
        const family = pinnedIp.includes(":") ? 6 : 4;
        if (options && (options as any).all) {
          cb(null, [{ address: pinnedIp, family }] as any);
        } else {
          cb(null, pinnedIp, family);
        }
      },
      ...(isHttps ? { servername: targetUrl.hostname } : {}),
    };

    const req = transport.request(reqOptions, (res) => {
      const headersMap = new Map<string, string>();
      for (const [key, value] of Object.entries(res.headers)) {
        if (value !== undefined) {
          headersMap.set(key.toLowerCase(), Array.isArray(value) ? value.join(", ") : value);
        }
      }

      const headersHelper = {
        get: (name: string) => headersMap.get(name.toLowerCase()) || null,
      };

      let totalBytes = 0;
      const chunks: Buffer[] = [];

      res.on("data", (chunk: Buffer) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_SIZE_BYTES) {
          req.destroy(new Error("Target web page exceeds the maximum allowed size (1 MB limit)."));
        } else {
          chunks.push(chunk);
        }
      });

      res.on("end", () => {
        signal.removeEventListener("abort", onAbort);
        const bodyBuffer = Buffer.concat(chunks);
        resolve({
          status: res.statusCode || 200,
          headers: headersHelper,
          body: bodyBuffer.toString("utf-8"),
        });
      });

      res.on("error", (err) => {
        reject(err);
      });
    });

    const onAbort = () => {
      req.destroy(new DOMException("The operation was aborted", "AbortError"));
    };

    signal.addEventListener("abort", onAbort, { once: true });

    req.on("error", (err) => {
      signal.removeEventListener("abort", onAbort);
      reject(err);
    });

    req.end();
  });
}

/**
 * Scrapes a public job URL safely with SSRF protection, strict timeouts, and size limits.
 */
export async function scrapeJobUrl(urlStr: string): Promise<ScrapeResult> {
  // Global timeout covers initial URL/DNS validation, connection, redirects, and streaming
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // Step 1: Pre-flight URL & SSRF Validation (with timeout signal)
    const validation = await validateJobUrl(urlStr, controller.signal);
    if (!validation.valid || !validation.url || !validation.pinnedIp) {
      return {
        success: false,
        error: validation.error || "Invalid or restricted URL.",
        advice: "Please copy and paste the job description text directly into the editor.",
      };
    }

    let currentUrlObj = validation.url;
    let currentPinnedIp = validation.pinnedIp;
    let response: {
      status: number;
      headers: { get: (name: string) => string | null };
      body: string;
    } | null = null;
    const MAX_REDIRECTS = 3;

    // Manual redirect follow with strict pinned-IP SSRF re-validation per hop
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
      const res = await fetchPinned(
        currentUrlObj,
        currentPinnedIp,
        controller.signal,
        {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 (ResuArchitect-JobReader/1.0)",
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        }
      );

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) {
          return {
            success: false,
            error: "Redirect status received without Location header.",
            advice: "Please copy and paste the job description text directly into the editor.",
          };
        }

        if (redirectCount === MAX_REDIRECTS) {
          return {
            success: false,
            error: "Too many redirects (exceeded 3 hops limit).",
            advice: "Please copy and paste the job description text directly into the editor.",
          };
        }

        // Validate redirect target BEFORE making outbound connection
        const nextUrlObj = new URL(location, currentUrlObj.toString());
        const redirectCheck = await validateJobUrl(nextUrlObj.toString(), controller.signal);
        if (!redirectCheck.valid || !redirectCheck.url || !redirectCheck.pinnedIp) {
          return {
            success: false,
            error: `Redirected to restricted destination: ${redirectCheck.error}`,
            advice: "Please copy and paste the job description text directly into the editor.",
          };
        }
        currentUrlObj = redirectCheck.url;
        currentPinnedIp = redirectCheck.pinnedIp;
        continue;
      }

      response = res;
      break;
    }

    if (!response) {
      return {
        success: false,
        error: "Failed to establish connection to target URL.",
        advice: "Please copy and paste the job description text directly into the editor.",
      };
    }

    // Step 3: Validate Content-Type
    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      return {
        success: false,
        error: `Unsupported content type "${contentType}". Only web pages (HTML/text) can be scraped.`,
        advice: "Please copy and paste the job description text directly into the editor.",
      };
    }

    // Step 4: Check Content-Length header limit (1MB)
    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_SIZE_BYTES) {
      return {
        success: false,
        error: "Target web page exceeds the maximum allowed size (1 MB limit).",
        advice: "Please copy and paste the job description text directly into the editor.",
      };
    }

    const html = response.body;

    // Step 5: Clean and extract text
    const { title, text } = extractReadableText(html);

    // Step 6: Detect anti-bot / authentication wall
    const antiBotCheck = detectAntiBotWall(response.status, html, text);
    if (antiBotCheck.isBlocked) {
      return {
        success: false,
        error: antiBotCheck.reason,
        advice: "Many job boards (e.g., LinkedIn, Workday, Greenhouse) require login or block automated scrapers. Please copy and paste the job description text directly into the editor.",
      };
    }

    return {
      success: true,
      text,
      title: title || undefined,
      sourceUrl: currentUrlObj.toString(),
    };
  } catch (err: unknown) {
    if (err instanceof Error && (err.name === "AbortError" || err.message.includes("aborted"))) {
      return {
        success: false,
        error: "Job fetch request timed out after 5 seconds.",
        advice: "The target website took too long to respond. Please copy and paste the job description text directly into the editor.",
      };
    }

    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Network error while fetching job: ${message}`,
      advice: "Please copy and paste the job description text directly into the editor.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
