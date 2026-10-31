import test, { describe, it } from "node:test";
import assert from "node:assert";
import net from "node:net";
import {
  isPrivateOrReservedIPv4,
  isPrivateOrReservedIPv6,
  isPrivateOrReservedIp,
  validateJobUrl,
  extractReadableText,
  detectAntiBotWall,
  extractFromLdJson,
  extractFromNextData,
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
    // Extended IPv6 blocks: 6to4, NAT64, Teredo, Documentation
    assert.strictEqual(isPrivateOrReservedIPv6("2002:c0a8:0101::1"), true, "6to4 should be blocked");
    assert.strictEqual(isPrivateOrReservedIPv6("64:ff9b::192.0.2.1"), true, "NAT64 should be blocked");
    assert.strictEqual(isPrivateOrReservedIPv6("2001:0000:4136:e378:8000:63bf:3fff:fdd2"), true, "Teredo should be blocked");
    assert.strictEqual(isPrivateOrReservedIPv6("2001:db8::1"), true, "Documentation prefix should be blocked");
  });

  it("should reject URLs containing embedded credentials (user/password)", async () => {
    const credResult = await validateJobUrl("http://admin:secret123@example.com/job");
    assert.strictEqual(credResult.valid, false);
    assert.ok(credResult.error?.includes("credentials"));

    const userOnlyResult = await validateJobUrl("http://user@example.com/job");
    assert.strictEqual(userOnlyResult.valid, false);
    assert.ok(userOnlyResult.error?.includes("credentials"));
  });

  it("should block wildcard DNS rebinding domains (.nip.io, .sslip.io, .localtest.me)", async () => {
    const nipResult = await validateJobUrl("http://127.0.0.1.nip.io/job");
    assert.strictEqual(nipResult.valid, false);
    assert.ok(nipResult.error?.includes("rebinding") || nipResult.error?.includes("SSRF"));

    const sslipResult = await validateJobUrl("http://192-168-1-1.sslip.io/job");
    assert.strictEqual(sslipResult.valid, false);
    assert.ok(sslipResult.error?.includes("rebinding") || sslipResult.error?.includes("SSRF"));

    const localtestResult = await validateJobUrl("http://app.localtest.me/job");
    assert.strictEqual(localtestResult.valid, false);
    assert.ok(localtestResult.error?.includes("rebinding") || localtestResult.error?.includes("SSRF"));
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

  it("should return validated pinnedIp for public domain and public IP literal to prevent DNS rebinding", async () => {
    const publicResult = await validateJobUrl("https://example.com");
    assert.strictEqual(publicResult.valid, true);
    assert.ok(publicResult.pinnedIp, "Should return pinnedIp for SSRF DNS rebinding prevention");
    assert.strictEqual(net.isIP(publicResult.pinnedIp!) !== 0, true);

    const publicIpResult = await validateJobUrl("http://8.8.8.8/job");
    assert.strictEqual(publicIpResult.valid, true);
    assert.strictEqual(publicIpResult.pinnedIp, "8.8.8.8");
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

  it("should extract structured JobPosting from JSON-LD schema (e.g. Microsoft, Greenhouse, Lever)", () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Careers at Microsoft</title>
          <script type="application/ld+json">
          {
            "@context": "http://schema.org",
            "@type": "JobPosting",
            "title": "Senior Software Engineer, Full-Stack",
            "hiringOrganization": { "@type": "Organization", "name": "Microsoft" },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Redmond",
                "addressRegion": "WA",
                "addressCountry": { "@type": "Country", "name": "US" }
              }
            },
            "employmentType": "FULL_TIME",
            "description": "Design and build highly scalable distributed backend systems and cloud platforms.",
            "responsibilities": ["Architect microservices in Go and C#", "Lead system telemetry and monitoring"],
            "qualifications": "6+ years software engineering experience in distributed systems and cloud platforms.",
            "skills": ["Distributed Systems", "Kubernetes", "C#", "Go", "Cloud"]
          }
          </script>
        </head>
        <body>
          <code id="pcsx-data" style="display:none;">{"themeOptions":{"customTheme":{"varTheme":{"primary":"#000"}}}}</code>
          <main>SPA Shell with dynamic loading</main>
        </body>
      </html>
    `;

    const { title, text } = extractReadableText(html);
    assert.strictEqual(title, "Senior Software Engineer, Full-Stack");
    assert.ok(text.includes("Company: Microsoft"));
    assert.ok(text.includes("Location: Redmond, WA, US"));
    assert.ok(text.includes("Employment Type: FULL_TIME"));
    assert.ok(text.includes("Design and build highly scalable distributed backend systems"));
    assert.ok(text.includes("Architect microservices in Go and C#"));
    assert.ok(text.includes("6+ years software engineering experience"));
    assert.ok(text.includes("Distributed Systems, Kubernetes, C#, Go, Cloud"));
    // Ensure hidden JSON configuration is never present
    assert.ok(!text.includes("themeOptions"));
    assert.ok(!text.includes("varTheme"));
  });

  it("should extract JobPosting nested within JSON-LD @graph array", () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              { "@type": "WebSite", "name": "Tech Corp" },
              {
                "@type": "JobPosting",
                "title": "Lead Cloud Architect",
                "hiringOrganization": "Tech Corp",
                "description": "<p>Lead our enterprise multi-cloud strategy on AWS and GCP.</p>",
                "skills": "AWS, GCP, Terraform, Kubernetes"
              }
            ]
          }
          </script>
        </head>
        <body><div>Content</div></body>
      </html>
    `;

    const result = extractFromLdJson(html);
    assert.ok(result);
    assert.strictEqual(result.title, "Lead Cloud Architect");
    assert.ok(result.text.includes("Company: Tech Corp"));
    assert.ok(result.text.includes("Lead our enterprise multi-cloud strategy on AWS and GCP."));
    assert.ok(result.text.includes("AWS, GCP, Terraform, Kubernetes"));
  });

  it("should strip hidden code tags, serialized JSON blobs, and Phenom career portal config", () => {
    const html = `
      <html>
        <head><title>Staff Engineer - Data Platform</title></head>
        <body>
          <code id="branding-data" style="display: none;">{"themeOptions": {"customTheme": {"navbar-height": "0px"}}}</code>
          <code id="pcsx-data" style="display:none;" data-nosnippet>{"questionsApplyV2": {"country": ["US", "CA", "UK"]}}</code>
          <div style="display:none;">{"careers-analyticskey": "123456789"}</div>
          <main>
            <h1>Staff Engineer - Data Platform</h1>
            <p>We are seeking a Staff Engineer to build real-time streaming architectures using Apache Kafka and Apache Flink.</p>
            <ul>
              <li>7+ years experience in distributed streaming</li>
              <li>Proficiency in Java, Scala, or Rust</li>
            </ul>
          </main>
        </body>
      </html>
    `;

    const { title, text } = extractReadableText(html);
    assert.strictEqual(title, "Staff Engineer - Data Platform");
    assert.ok(!text.includes("themeOptions"));
    assert.ok(!text.includes("questionsApplyV2"));
    assert.ok(!text.includes("careers-analyticskey"));
    assert.ok(text.includes("Staff Engineer - Data Platform"));
    assert.ok(text.includes("streaming architectures using Apache Kafka"));
    assert.ok(text.includes("• 7+ years experience in distributed streaming"));
  });

  it("should extract job details from Next.js __NEXT_DATA__ props if JSON-LD is absent", () => {
    const nextHtml = `
      <html>
        <head><title>Backend Engineer</title></head>
        <body>
          <script id="__NEXT_DATA__" type="application/json">
          {
            "props": {
              "pageProps": {
                "job": {
                  "title": "Principal Systems Engineer",
                  "company": "NextGen Systems",
                  "location": "New York, NY",
                  "description": "<p>Design ultra-low latency trading systems in C++ and Linux kernel tuning.</p>"
                }
              }
            }
          }
          </script>
          <div>Loading application...</div>
        </body>
      </html>
    `;

    const result = extractFromNextData(nextHtml);
    assert.ok(result);
    assert.strictEqual(result.title, "Principal Systems Engineer");
    assert.ok(result.text.includes("Company: NextGen Systems"));
    assert.ok(result.text.includes("Location: New York, NY"));
    assert.ok(result.text.includes("Design ultra-low latency trading systems in C++"));
  });

  it("should extract Microsoft Careers Phenom People JobPosting (pid 1970393557023248) with isolated headings and bullets", () => {
    const msftHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Machine Learning Engineer - Microsoft Careers</title>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": "Senior Machine Learning Engineer",
            "hiringOrganization": { "@type": "Organization", "name": "Microsoft" },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Redmond",
                "addressRegion": "WA",
                "addressCountry": "US"
              }
            },
            "description": "<p>Join the Azure AI team to build generative AI solutions at scale.</p><p><strong>Required Qualifications:</strong></p><ul><li>5+ years experience in Python and C++</li><li>Experience with PyTorch, TensorFlow, and Docker</li></ul><p><strong>Preferred Qualifications:</strong></p><ul><li>Experience deploying models on Kubernetes and Azure</li><li>Strong knowledge of distributed systems</li></ul>"
          }
          </script>
        </head>
        <body>
          <code id="pcsx-data" style="display:none;">{"themeOptions":{"customTheme":{"primary":"#000"}}}</code>
          <div style="display:none;">{"careers-analyticskey": "987654321"}</div>
          <main>Careers at Microsoft</main>
        </body>
      </html>
    `;

    const { title, text } = extractReadableText(msftHtml);
    assert.strictEqual(title, "Senior Machine Learning Engineer");
    assert.ok(text.includes("Company: Microsoft"));
    assert.ok(text.includes("Location: Redmond, WA, US"));
    assert.ok(!text.includes("themeOptions"));
    assert.ok(!text.includes("careers-analyticskey"));
    assert.ok(text.includes("### Required Qualifications"));
    assert.ok(text.includes("### Preferred Qualifications"));
    assert.ok(text.includes("• 5+ years experience in Python and C++"));
    assert.ok(text.includes("• Experience with PyTorch, TensorFlow, and Docker"));
    assert.ok(text.includes("• Experience deploying models on Kubernetes and Azure"));
  });

  it("should repair glued inline headings and mashed text without block boundaries (Tier 3 Post-Processing)", () => {
    const mashedHtml = `
      <div>
        <h1>Cloud Solutions Architect</h1>
        <p>Architect large-scale enterprise services across multi-region environments.Required Qualifications: 5+ years in Go and Kubernetes.Preferred Qualifications: Deep expertise in Terraform and AWS.</p>
      </div>
    `;

    const { text } = extractReadableText(mashedHtml);
    assert.ok(text.includes("### Required Qualifications"));
    assert.ok(text.includes("### Preferred Qualifications"));
    assert.ok(text.includes("5+ years in Go and Kubernetes"));
    assert.ok(text.includes("Deep expertise in Terraform and AWS"));
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
