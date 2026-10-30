import test, { describe, it } from "node:test";
import assert from "node:assert";
import {
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
  isPrivateOrReservedIp,
  validateJobUrl,
  extractReadableText,
  detectAntiBotWall,
} from "../src/lib/scraper/urlScraper";

describe("SSRF Protection & IP Validation", () => {
  it("should block loopback IPv4 addresses (127.0.0.0/8)", () => {
    assert.strictEqual(isPrivateOrReservedIPv4("127.0.0.1"), true);
    assert.strictEqual(isPrivateOrReservedIPv4("127.255.255.254"), true);
    assert.strictEqual(isPrivateOrReservedIp("127.0.0.1"), true);
  });

  it("should block private network IPv4 addresses (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)", () => {
    assert.strictEqual(isPrivateOrReservedIPv4("10.0.0.1"), true);
    assert.strictEqual(isPrivateOrReservedIPv4("10.254.1.1"), true);
    assert.strictEqual(isPrivateOrReservedIPv4("172.16.0.1"), true);
    assert.strictEqual(isPrivateOrReservedIPv4("172.31.255.255"), true);
    assert.strictEqual(isPrivateOrReservedIPv4("192.168.1.1"), true);
    assert.strictEqual(isPrivateOrReservedIPv4("192.168.0.100"), true);
  });

  it("should block cloud metadata and link-local IPv4 addresses (169.254.0.0/16)", () => {
    assert.strictEqual(isPrivateOrReservedIPv4("169.254.169.254"), true); // AWS / GCP / Azure metadata
    assert.strictEqual(isPrivateOrReservedIPv4("169.254.1.1"), true);
  });

  it("should block carrier-grade NAT, test-net, and reserved IPv4 blocks", () => {
    assert.strictEqual(isPrivateOrReservedIPv4("0.0.0.0"), true);
    assert.strictEqual(isPrivateOrReservedIPv4("100.64.0.1"), true); // CGNAT
    assert.strictEqual(isPrivateOrReservedIPv4("192.0.2.1"), true); // TEST-NET-1
    assert.strictEqual(isPrivateOrReservedIPv4("198.51.100.1"), true); // TEST-NET-2
    assert.strictEqual(isPrivateOrReservedIPv4("203.0.113.1"), true); // TEST-NET-3
    assert.strictEqual(isPrivateOrReservedIPv4("224.0.0.1"), true); // Multicast
    assert.strictEqual(isPrivateOrReservedIPv4("240.0.0.1"), true); // Reserved
  });

  it("should allow legitimate public IPv4 addresses", () => {
    assert.strictEqual(isPrivateOrReservedIPv4("8.8.8.8"), false);
    assert.strictEqual(isPrivateOrReservedIPv4("1.1.1.1"), false);
    assert.strictEqual(isPrivateOrReservedIPv4("142.250.190.46"), false);
  });

  it("should block IPv6 loopback, link-local, unique local, and IPv4-mapped addresses", () => {
    assert.strictEqual(isPrivateOrReservedIPv6("::1"), true);
    assert.strictEqual(isPrivateOrReservedIPv6("fe80::1"), true);
    assert.strictEqual(isPrivateOrReservedIPv6("fc00::1"), true);
    assert.strictEqual(isPrivateOrReservedIPv6("fd12:3456:789a::1"), true);
    assert.strictEqual(isPrivateOrReservedIPv6("::ffff:127.0.0.1"), true);
    assert.strictEqual(isPrivateOrReservedIPv6("::ffff:192.168.1.1"), true);
  });

  it("should reject non-HTTP/HTTPS protocols", async () => {
    const fileResult = await validateJobUrl("file:///etc/passwd");
    assert.strictEqual(fileResult.valid, false);
    assert.ok(fileResult.error?.includes("Protocol"));

    const ftpResult = await validateJobUrl("ftp://ftp.example.com/job");
    assert.strictEqual(ftpResult.valid, false);

    const jsResult = await validateJobUrl("javascript:alert(1)");
    assert.strictEqual(jsResult.valid, false);
  });

  it("should block localhost and internal cloud metadata domains", async () => {
    const localhostResult = await validateJobUrl("http://localhost:3000/job");
    assert.strictEqual(localhostResult.valid, false);
    assert.ok(localhostResult.error?.includes("SSRF"));

    const metadataResult = await validateJobUrl("http://169.254.169.254/latest/meta-data/");
    assert.strictEqual(metadataResult.valid, false);

    const gcpMetaResult = await validateJobUrl("http://metadata.google.internal/computeMetadata/v1/");
    assert.strictEqual(gcpMetaResult.valid, false);

    const internalDomain = await validateJobUrl("http://app.internal/job");
    assert.strictEqual(internalDomain.valid, false);
  });

  it("should permit legitimate public domains and block private IP literals in URLs", async () => {
    const publicResult = await validateJobUrl("https://example.com");
    assert.strictEqual(publicResult.valid, true);
    assert.ok(publicResult.url);

    const privateIpResult = await validateJobUrl("http://127.0.0.1:8080/job");
    assert.strictEqual(privateIpResult.valid, false);
    assert.ok(privateIpResult.error?.includes("SSRF") || privateIpResult.error?.includes("private"));

    const privateNetworkResult = await validateJobUrl("http://192.168.1.50/job");
    assert.strictEqual(privateNetworkResult.valid, false);
    assert.ok(privateNetworkResult.error?.includes("SSRF") || privateNetworkResult.error?.includes("private"));
  });
});

describe("HTML Parser & Job Text Extraction", () => {
  it("should strip script, style, nav, and footer tags cleanly", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Senior Frontend Engineer - Stripe</title>
          <style>.hero { color: red; }</style>
          <script>console.log("analytics");</script>
        </head>
        <body>
          <nav><a href="/">Home</a><a href="/jobs">Jobs</a></nav>
          <header>Company Logo</header>
          <main>
            <h1>Senior Frontend Engineer</h1>
            <p>We are seeking an experienced React & TypeScript engineer to scale our merchant platform.</p>
            <h3>Requirements:</h3>
            <ul>
              <li>5+ years of TypeScript experience</li>
              <li>Strong foundation in Next.js and Tailwind CSS</li>
              <li>Experience with distributed microservices</li>
            </ul>
          </main>
          <footer>Copyright 2026 Stripe, Inc.</footer>
        </body>
      </html>
    `;

    const { title, text } = extractReadableText(html);
    assert.strictEqual(title, "Senior Frontend Engineer - Stripe");
    assert.ok(!text.includes("console.log"));
    assert.ok(!text.includes(".hero"));
    assert.ok(!text.includes("Company Logo"));
    assert.ok(!text.includes("Copyright 2026"));
    assert.ok(text.includes("Senior Frontend Engineer"));
    assert.ok(text.includes("React & TypeScript"));
    assert.ok(text.includes("• 5+ years of TypeScript experience"));
    assert.ok(text.includes("• Strong foundation in Next.js"));
  });

  it("should decode HTML entities accurately", () => {
    const html = `<p>Experience with C&plus;&plus;, AT&amp;T &quot;smart&quot; contracts &amp; SQL &gt; 5 yrs.</p>`;
    const { text } = extractReadableText(html);
    assert.ok(text.includes("AT&T"));
    assert.ok(text.includes('"smart"'));
    assert.ok(text.includes("SQL > 5 yrs"));
  });
});

describe("Anti-Bot & Wall Detection", () => {
  it("should flag HTTP 401 and 403 as blocked", () => {
    const check403 = detectAntiBotWall(403, "Forbidden", "Forbidden access");
    assert.strictEqual(check403.isBlocked, true);
    assert.ok(check403.reason?.includes("403"));

    const check401 = detectAntiBotWall(401, "Unauthorized", "Unauthorized access");
    assert.strictEqual(check401.isBlocked, true);
  });

  it("should detect Cloudflare and LinkedIn bot protection patterns", () => {
    const cfCheck = detectAntiBotWall(
      200,
      "<html><head><title>Attention Required! | Cloudflare</title></head><body>Verify you are human</body></html>",
      "Verify you are human to continue."
    );
    assert.strictEqual(cfCheck.isBlocked, true);
    assert.ok(cfCheck.reason?.includes("anti-bot"));

    const liCheck = detectAntiBotWall(
      200,
      "<div>Sign in to LinkedIn to view full job posting</div>",
      "Sign in to LinkedIn"
    );
    assert.strictEqual(liCheck.isBlocked, true);
  });

  it("should pass standard job posting content", () => {
    const legitHtml = "<h1>Staff Engineer</h1><p>We are hiring a staff software architect with 8+ years experience in distributed cloud systems, Kubernetes, and Golang.</p>";
    const { text } = extractReadableText(legitHtml);
    const check = detectAntiBotWall(200, legitHtml, text);
    assert.strictEqual(check.isBlocked, false);
  });
});
