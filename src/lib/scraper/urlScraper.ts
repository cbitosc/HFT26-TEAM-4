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

function parseIPv6Groups(raw: string): number[] | null {
  let ip = raw.toLowerCase().trim().replace(/^\[|\]$/g, "");
  if (ip.includes(".")) {
    const lastColon = ip.lastIndexOf(":");
    const v4 = ip.slice(lastColon + 1);
    const parts = v4.split(".").map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
      const hex =
        ((parts[0] << 8) | parts[1]).toString(16) +
        ":" +
        ((parts[2] << 8) | parts[3]).toString(16);
      ip = ip.slice(0, lastColon + 1) + hex;
    }
  }
  const parts = ip.split("::");
  if (parts.length > 2) return null;
  const left = parts[0] ? parts[0].split(":") : [];
  const right = parts[1] ? parts[1].split(":") : [];
  if (parts.length === 2) {
    const missing = 8 - (left.length + right.length);
    if (missing < 0) return null;
    const middle = Array(missing).fill("0");
    return [...left, ...middle, ...right].map((h) => parseInt(h || "0", 16));
  }
  if (left.length !== 8) return null;
  return left.map((h) => parseInt(h, 16));
}

/**
 * Validates IPv6 address against loopback, link-local, unique local, IPv4-mapped, 6to4, NAT64, and Teredo ranges.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim().replace(/^\[|\]$/g, "");

  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:192.168.1.1)
  if (normalized.startsWith("::ffff:")) {
    const v4Part = normalized.replace("::ffff:", "");
    if (v4Part.includes(".")) {
      return isPrivateOrReservedIPv4(v4Part);
    }
  }

  // Loopback (::1) and unspecified (::)
  if (normalized === "::1" || normalized === "::") return true;

  const groups = parseIPv6Groups(normalized);
  if (!groups || groups.length !== 8 || !groups.every((n) => Number.isInteger(n) && n >= 0 && n <= 0xffff)) {
    return true;
  }

  // :: (unspecified) and ::1 (loopback)
  if (groups.every((g) => g === 0)) return true;
  if (groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1) return true;

  // ::ffff:x:y (IPv4-mapped) & ::x:y (IPv4-compatible)
  if (groups.slice(0, 5).every((g) => g === 0) && (groups[5] === 0xffff || groups[5] === 0)) {
    const v4 = `${groups[6] >> 8}.${groups[6] & 0xff}.${groups[7] >> 8}.${groups[7] & 0xff}`;
    return isPrivateOrReservedIPv4(v4);
  }
  // 2002::/16 (6to4 tunneling)
  if (groups[0] === 0x2002) {
    const v4 = `${groups[1] >> 8}.${groups[1] & 0xff}.${groups[2] >> 8}.${groups[2] & 0xff}`;
    return isPrivateOrReservedIPv4(v4);
  }
  // 64:ff9b::/96 (NAT64 well-known prefix)
  if (groups[0] === 0x64 && groups[1] === 0xff9b && groups.slice(2, 6).every((g) => g === 0)) {
    const v4 = `${groups[6] >> 8}.${groups[6] & 0xff}.${groups[7] >> 8}.${groups[7] & 0xff}`;
    return isPrivateOrReservedIPv4(v4);
  }
  // 2001:0000::/32 (Teredo tunneling)
  if (groups[0] === 0x2001 && groups[1] === 0) {
    const v4 = `${(groups[6] ^ 0xffff) >> 8}.${(groups[6] ^ 0xffff) & 0xff}.${(groups[7] ^ 0xffff) >> 8}.${(groups[7] ^ 0xffff) & 0xff}`;
    return isPrivateOrReservedIPv4(v4);
  }

  if ((groups[0] & 0xfe00) === 0xfc00) return true; // ULA fc00::/7
  if ((groups[0] & 0xffc0) === 0xfe80) return true; // Link-local fe80::/10
  if ((groups[0] & 0xffc0) === 0xfec0) return true; // Site-local fec0::/10
  if (groups[0] === 0x2001 && groups[1] === 0xdb8) return true; // Documentation
  if (groups[0] === 0x100 && groups[1] === 0 && groups[2] === 0 && groups[3] === 0) return true; // Discard
  if ((groups[0] & 0xff00) === 0xff00) return true; // Multicast

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

  // Reject URLs containing credentials
  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: "URLs containing credentials are not permitted (SSRF protection).",
    };
  }

  // Restrict outbound ports to standard web ports
  if (parsed.port) {
    const portNum = parseInt(parsed.port, 10);
    const ALLOWED_PORTS = [80, 443, 8080, 8443];
    if (!ALLOWED_PORTS.includes(portNum)) {
      return {
        valid: false,
        error: `Port ${portNum} is not permitted for job scraping (only standard web ports 80, 443, 8080, 8443 are allowed). SSRF protection rejects non-standard ports.`,
      };
    }
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");

  // Disallow forbidden internal hostnames, wildcard DNS services, and local TLDs
  const forbiddenHostnames = [
    "localhost",
    "metadata.google.internal",
    "instance-data",
    "metadata",
    "localtest.me",
    "lvh.me",
    "vcap.me",
    "traefik.me",
  ];

  const forbiddenSuffixes = [
    ".localhost",
    ".local",
    ".internal",
    ".lan",
    ".home",
    ".home.arpa",
    ".corp",
    ".test",
    ".example",
    ".invalid",
    ".nip.io",
    ".sslip.io",
    ".localtest.me",
    ".lvh.me",
    ".vcap.me",
    ".traefik.me",
  ];

  const embeddedIpMatch = hostname.match(/\b(\d{1,3})[.-](\d{1,3})[.-](\d{1,3})[.-](\d{1,3})\b/);
  const hasEmbeddedPrivateIp =
    embeddedIpMatch &&
    isPrivateOrReservedIPv4(
      `${embeddedIpMatch[1]}.${embeddedIpMatch[2]}.${embeddedIpMatch[3]}.${embeddedIpMatch[4]}`
    );

  if (
    forbiddenHostnames.includes(hostname) ||
    forbiddenSuffixes.some((sfx) => hostname.endsWith(sfx)) ||
    hasEmbeddedPrivateIp
  ) {
    return {
      valid: false,
      error: "Access to localhost, wildcard DNS aliases, internal hosts, and cloud metadata is blocked (SSRF protection).",
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
            error: "Target hostname resolves to a private or reserved IP address. Request blocked for SSRF protection.",
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
export function decodeHtmlEntities(text: string): string {
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
 * Tier 3: Structural Post-Processing & Header Repair.
 * Rescues glued headings, normalizes bullet points to "\n- ", collapses excess newlines,
 * and strips residual tracker / config noise.
 */
export function repairExtractedText(raw: string): string {
  if (!raw) return "";
  let text = raw;

  // 1. Repair inline or glued headings that lack preceding newlines
  // e.g. "systems.Required Qualifications: 5+ years..." -> "systems.\n\n### Required Qualifications:\n5+ years..."
  const headingGluedPatterns = [
    /([^\n#])\s*(\b(?:Required|Minimum|Basic|Core|Mandatory|Key)\s+(?:Qualifications|Requirements|Skills|Experience)\s*:?)/gi,
    /([^\n#])\s*(\b(?:Preferred|Desired|Additional|Bonus|Optional)\s+(?:Qualifications|Requirements|Skills|Experience)\s*:?)/gi,
    /([^\n#])\s*(\b(?:Nice\s+to\s+have|Bonus\s+points|What\s+we'd\s+love\s+to\s+see)\s*:?)/gi,
    /([^\n#])\s*(\b(?:Core\s+|Primary\s+|Key\s+)?Responsibilities\s*:?)/gi,
    /([^\n#])\s*(\bWhat\s+You(?:'ll|\s+will)\s+(?:Do|Need|Bring)\s*:?)/gi,
  ];

  for (const pattern of headingGluedPatterns) {
    text = text.replace(pattern, "$1\n\n### $2\n\n");
  }

  // 2. Format standalone headings with markdown prefix if missing
  text = text.replace(
    /^(\s*)(?:#+\s*)?(Required\s+Qualifications|Preferred\s+Qualifications|Qualifications|Requirements|Responsibilities|Nice\s+to\s+Have|Key\s+Qualifications|Basic\s+Qualifications|Minimum\s+Qualifications)\s*:?/gim,
    "\n\n### $2\n"
  );

  // 3. Normalize bullet points at line starts (-, •, *, +, ·, ‣, ⁃) to "• "
  text = text.replace(/^[ \t]*[-•*+·‣⁃][ \t]*/gm, "• ");

  // 4. Isolate glued inline bullet symbols (•, ·, ‣, ⁃) but not hyphens/dashes between words
  text = text.replace(/([^\n])\s+[•·‣⁃]\s+/g, "$1\n• ");

  // 5. Collapse 3+ newlines to "\n\n"
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

/**
 * Strips HTML formatting, structural tags, and entities to produce clean text.
 */
export function cleanHtmlToText(raw: string): string {
  if (!raw) return "";
  let text = raw;
  if (text.includes("&lt;") || text.includes("&gt;") || text.includes("&amp;")) {
    text = decodeHtmlEntities(text);
  }

  // Convert bold/strong headings to markdown headings
  text = text.replace(
    /<(?:strong|b)\b[^>]*>\s*(Required\s+Qualifications|Preferred\s+Qualifications|Qualifications|Requirements|Responsibilities|Nice\s+to\s+Have|Key\s+Qualifications|Basic\s+Qualifications|Minimum\s+Qualifications|What\s+You(?:'ll|\s+will)\s+(?:Do|Need|Bring))\s*:?\s*<\/(?:strong|b)>/gi,
    "\n\n### $1\n\n"
  );

  text = text
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

  text = text.replace(/<[^>]+>/g, "");
  text = decodeHtmlEntities(text);

  const lines = text.split("\n");
  const filtered: string[] = [];
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed === "•" || trimmed === "-" || trimmed === "*") {
      if (filtered.length > 0 && filtered[filtered.length - 1] !== "") {
        filtered.push("");
      }
      continue;
    }
    filtered.push(trimmed);
  }
  const joined = filtered.join("\n").trim();
  return repairExtractedText(joined);
}

/**
 * Extracts structured job description from schema.org JobPosting in JSON-LD.
 * Used by Microsoft Careers, Greenhouse, Lever, Workday, Ashby, and top ATS platforms.
 */
export function extractFromLdJson(html: string): { title: string; text: string } | null {
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    const content = match[1].trim();
    try {
      const parsed = JSON.parse(content);
      const candidates: any[] = Array.isArray(parsed)
        ? parsed
        : parsed["@graph"] && Array.isArray(parsed["@graph"])
        ? parsed["@graph"]
        : [parsed];

      for (const item of candidates) {
        if (!item || typeof item !== "object") continue;
        const type = item["@type"];
        const isJobPosting =
          type === "JobPosting" ||
          (Array.isArray(type) && type.includes("JobPosting")) ||
          type === "http://schema.org/JobPosting" ||
          type === "https://schema.org/JobPosting" ||
          type === "schema:JobPosting";

        if (isJobPosting) {
          const title = item.title || item.name || "";
          const company =
            typeof item.hiringOrganization === "object" && item.hiringOrganization
              ? item.hiringOrganization.name || ""
              : typeof item.hiringOrganization === "string"
              ? item.hiringOrganization
              : "";

          let location = "";
          if (item.jobLocation) {
            if (typeof item.jobLocation.address === "string") {
              location = item.jobLocation.address;
            } else if (typeof item.jobLocation.address === "object" && item.jobLocation.address) {
              const addr = item.jobLocation.address;
              const locality = addr.addressLocality || "";
              const region = addr.addressRegion || "";
              const country =
                typeof addr.addressCountry === "object" && addr.addressCountry
                  ? addr.addressCountry.name || ""
                  : typeof addr.addressCountry === "string"
                  ? addr.addressCountry
                  : "";
              location = [locality, region, country].filter(Boolean).join(", ");
            } else if (item.jobLocation.name) {
              location = item.jobLocation.name;
            }
          }

          const parts: string[] = [];
          if (title) parts.push(`# ${title}`);
          if (company) parts.push(`Company: ${company}`);
          if (location) parts.push(`Location: ${location}`);
          if (item.employmentType) {
            const emp = Array.isArray(item.employmentType)
              ? item.employmentType.join(", ")
              : String(item.employmentType);
            parts.push(`Employment Type: ${emp}`);
          }
          if (parts.length > 0) parts.push("");

          const desc = cleanHtmlToText(item.description || "");
          if (desc) {
            parts.push(desc);
          }

          if (item.responsibilities) {
            const resp = cleanHtmlToText(
              Array.isArray(item.responsibilities)
                ? item.responsibilities.join("\n• ")
                : String(item.responsibilities)
            );
            if (resp && !desc.includes(resp.slice(0, 50))) {
              parts.push("\n### Responsibilities\n" + resp);
            }
          }

          if (item.qualifications || item.experienceRequirements) {
            const qual = cleanHtmlToText(
              String(item.qualifications || item.experienceRequirements)
            );
            if (qual && !desc.includes(qual.slice(0, 50))) {
              parts.push("\n### Qualifications\n" + qual);
            }
          }

          if (item.skills) {
            const skills = cleanHtmlToText(
              Array.isArray(item.skills) ? item.skills.join(", ") : String(item.skills)
            );
            if (skills && !desc.includes(skills.slice(0, 50))) {
              parts.push("\n### Skills\n" + skills);
            }
          }

          const combined = repairExtractedText(parts.join("\n"));
          if (combined.length >= 80) {
            return { title, text: combined };
          }
        }
      }
    } catch {
      // Ignore JSON parse errors in malformed script tags
    }
  }

  return null;
}

/**
 * Extracts structured job description from Next.js __NEXT_DATA__ hydration props if available.
 */
export function extractFromNextData(html: string): { title: string; text: string } | null {
  const match = html.match(/<script\b[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;

  try {
    const data = JSON.parse(match[1]);
    const pageProps = data.props?.pageProps;
    if (!pageProps || typeof pageProps !== "object") return null;

    const job =
      pageProps.job ||
      pageProps.jobPosting ||
      pageProps.jobDetail ||
      pageProps.position ||
      pageProps.listing;

    if (job && typeof job === "object") {
      const title = job.title || job.name || job.jobTitle || "";
      const desc = cleanHtmlToText(job.description || job.jobDescription || job.content || "");
      const parts: string[] = [];
      if (title) parts.push(`# ${title}`);
      if (job.company || job.companyName) {
        parts.push(`Company: ${job.company || job.companyName}`);
      }
      if (job.location) {
        parts.push(
          `Location: ${typeof job.location === "string" ? job.location : job.location.name || ""}`
        );
      }
      if (parts.length > 0) parts.push("");
      if (desc) parts.push(desc);

      const combined = repairExtractedText(parts.join("\n"));
      if (combined.length >= 80) {
        return { title, text: combined };
      }
    }
  } catch {
    // Ignore invalid JSON in __NEXT_DATA__
  }

  return null;
}

/**
 * Strips markup, scripts, and navigation clutter from raw HTML,
 * extracting clean, readable job description text and title.
 */
export function extractReadableText(html: string): { title: string; text: string } {
  // Priority 1: Schema.org JobPosting in JSON-LD (standard for modern ATS & job boards)
  const ldResult = extractFromLdJson(html);
  if (ldResult && ldResult.text.length >= 80) {
    return ldResult;
  }

  // Priority 2: Next.js __NEXT_DATA__ hydration state
  const nextDataResult = extractFromNextData(html);
  if (nextDataResult && nextDataResult.text.length >= 80) {
    return nextDataResult;
  }

  // Priority 3: Fallback to Semantic Container or HTML body extraction (Tier 2)
  let title = "";
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = decodeHtmlEntities(titleMatch[1].trim());
  }

  // Target semantic job containers if present
  let sourceHtml = html;
  const containerMatch = html.match(
    /<(main|article|section|div)\b[^>]*(?:id|class)=["'][^"']*(?:job-description|jobDescription|job-details|jobDetails|posting-description|description__text|career-job-desc|job-body|content-body|job_description)[^"']*["'][\s\S]*?<\/\1>/i
  );
  if (containerMatch && containerMatch[0].length >= 150) {
    sourceHtml = containerMatch[0];
  }

  // Remove non-content tags and their nested contents
  let cleaned = sourceHtml
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, "")
    .replace(/<template\b[\s\S]*?<\/template>/gi, "")
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, "")
    .replace(/<header\b[\s\S]*?<\/header>/gi, "")
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, "")
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, "")
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, "");

  // Strip hidden elements and data blocks (e.g. style="display:none", hidden, aria-hidden="true", data-nosnippet)
  cleaned = cleaned.replace(
    /<(code|div|span|section|pre|p|textarea|article)\b[^>]*style=["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden)[^"']*["'][\s\S]*?<\/\1>/gi,
    ""
  );
  cleaned = cleaned.replace(
    /<(code|div|span|section|pre|p|textarea|article)\b[^>]*(?:\bhidden\b|aria-hidden=["']true["'])[\s\S]*?<\/\1>/gi,
    ""
  );
  cleaned = cleaned.replace(
    /<(code|div|span|section|pre|p|textarea|article)\b[^>]*data-nosnippet[\s\S]*?<\/\1>/gi,
    ""
  );
  // Strip code and pre elements (which on career sites hold serialized configs / state dumps)
  cleaned = cleaned.replace(/<code\b[\s\S]*?<\/code>/gi, "");
  cleaned = cleaned.replace(/<pre\b[\s\S]*?<\/pre>/gi, "");

  // Convert bold headings to markdown headings
  cleaned = cleaned.replace(
    /<(?:strong|b)\b[^>]*>\s*(Required\s+Qualifications|Preferred\s+Qualifications|Qualifications|Requirements|Responsibilities|Nice\s+to\s+Have|Key\s+Qualifications|Basic\s+Qualifications|Minimum\s+Qualifications|What\s+You(?:'ll|\s+will)\s+(?:Do|Need|Bring))\s*:?\s*<\/(?:strong|b)>/gi,
    "\n\n### $1\n\n"
  );

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
    if (!line || line === "•" || line === "-" || line === "*") {
      if (filteredLines.length > 0 && filteredLines[filteredLines.length - 1] !== "") {
        filteredLines.push("");
      }
      continue;
    }

    // Filter out serialized JSON dumps and configurations
    if (
      (line.startsWith("{") && line.endsWith("}")) ||
      (line.startsWith("[{") && line.endsWith("}]")) ||
      line.includes('"themeOptions":') ||
      line.includes('"varTheme":') ||
      line.includes('"navbarData":') ||
      line.includes('"questionsApply') ||
      line.includes("careers-analyticskey") ||
      line.includes('"customTheme":') ||
      line.includes('"jobcard-')
    ) {
      continue;
    }

    // Filter out UUID tracking strings
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:-[0-9]+)?$/i.test(line)) {
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

  const resultText = repairExtractedText(filteredLines.join("\n"));
  return { title, text: resultText };
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

      // SEC-06: Check Content-Type header BEFORE buffering to avoid wasting memory on non-HTML responses.
      const earlyContentType = headersHelper.get("content-type") || "";
      if (
        earlyContentType &&
        !earlyContentType.includes("text/html") &&
        !earlyContentType.includes("text/plain") &&
        !earlyContentType.includes("application/xhtml")
      ) {
        req.destroy();
        return reject(
          new Error(
            `Unsupported content type "${earlyContentType.split(";")[0].trim()}". Only web pages (HTML/text) can be scraped.`
          )
        );
      }

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

/**
 * Fetches HTML from a remote URL with strict SSRF protection, DNS pinning, and size limits.
 * Used for fetching live job application forms and candidate portals.
 */
export async function fetchHtmlSafely(urlStr: string): Promise<{
  success: boolean;
  html?: string;
  finalUrl?: string;
  status?: number;
  error?: string;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const validation = await validateJobUrl(urlStr, controller.signal);
    if (!validation.valid || !validation.url || !validation.pinnedIp) {
      return {
        success: false,
        error: validation.error || "Invalid or restricted URL.",
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
          };
        }

        if (redirectCount === MAX_REDIRECTS) {
          return {
            success: false,
            error: "Too many redirects (exceeded 3 hops limit).",
          };
        }

        const nextUrlObj = new URL(location, currentUrlObj.toString());
        const redirectCheck = await validateJobUrl(nextUrlObj.toString(), controller.signal);
        if (!redirectCheck.valid || !redirectCheck.url || !redirectCheck.pinnedIp) {
          return {
            success: false,
            error: `Redirected to restricted destination: ${redirectCheck.error}`,
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
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      return {
        success: false,
        error: `Unsupported content type "${contentType}". Only web pages (HTML/text) can be parsed.`,
      };
    }

    return {
      success: true,
      html: response.body,
      finalUrl: currentUrlObj.toString(),
      status: response.status,
    };
  } catch (err: unknown) {
    if (err instanceof Error && (err.name === "AbortError" || err.message.includes("aborted"))) {
      return {
        success: false,
        error: "Form fetch request timed out after 5 seconds.",
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Network error while fetching form: ${message}`,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
