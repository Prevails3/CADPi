export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Security headers helper
    function applySecurityHeaders(headers) {
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(), focus-without-user-activation=()'
      );
      headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
      headers.set(
        'Content-Security-Policy',
        "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://api.web3forms.com; frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://*.hcaptcha.com https://hcaptcha.com; upgrade-insecure-requests"
      );
    }

    function escapeHtml(str) {
      return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function sanitizeBlogHtml(rawHtml) {
      let html = String(rawHtml ?? '');
      // Remove dangerous tags and their contents
      html = html.replace(
        /<\s*(script|style|object|embed|applet|meta|link|base|form|input|button|textarea|select)\b[^>]*>([\s\S]*?<\s*\/\s*\1\s*>)?/gi,
        ''
      );
      // Strip inline event handlers (e.g., onload=, onerror=, onclick=)
      html = html.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
      // Strip javascript:, vbscript:, and data:text/html URIs in href/src/action
      html = html.replace(
        /\b(href|src|xlink:href|action|formaction)\s*=\s*(?:"\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^"]*"|'\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^']*'|(?:\s*(?:javascript|vbscript|data\s*:\s*text\/html)[^\s>]+))/gi,
        '$1="#"'
      );
      // Restrict <iframe> tags strictly to privacy-enhanced YouTube embeds
      html = html.replace(/<iframe\b([^>]*)>([\s\S]*?)<\/iframe>/gi, (full, attrs) => {
        const srcMatch = attrs.match(/\bsrc\s*=\s*["']https:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?[^"']*)?["']/i);
        if (!srcMatch) return '';
        const videoId = srcMatch[1];
        const titleMatch = attrs.match(/\btitle\s*=\s*["']([^"']*)["']/i);
        const safeTitle = escapeHtml(titleMatch ? titleMatch[1] : 'Investigative Video Briefing');
        return `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="${safeTitle}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>`;
      });
      // Restrict <img> tags to safe HTTPS or first-party media/asset paths
      html = html.replace(/<img\b([^>]*)>/gi, (full, attrs) => {
        const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
        if (!srcMatch) return '';
        const rawSrc = srcMatch[1].trim();
        if (!/^(?:\/api\/media\/img_[a-zA-Z0-9_.-]+|(?:\.\.\/|\/)?assets\/[a-zA-Z0-9_./-]+|https:\/\/[^\s"'<>]+)$/i.test(rawSrc)) {
          return '';
        }
        const altMatch = attrs.match(/\balt\s*=\s*["']([^"']*)["']/i);
        const widthMatch = attrs.match(/\bwidth\s*=\s*["']?(\d{1,5})["']?/i);
        const heightMatch = attrs.match(/\bheight\s*=\s*["']?(\d{1,5})["']?/i);
        const safeSrc = escapeHtml(rawSrc);
        const safeAlt = escapeHtml(altMatch ? altMatch[1] : '');
        const widthAttr = widthMatch ? ` width="${widthMatch[1]}"` : '';
        const heightAttr = heightMatch ? ` height="${heightMatch[1]}"` : '';
        return `<img src="${safeSrc}" alt="${safeAlt}"${widthAttr}${heightAttr} loading="lazy">`;
      });
      return html.trim();
    }

    function detectImageMimeFromBytes(bytes) {
      if (!bytes || bytes.length < 12) return null;
      // JPEG: FF D8 FF
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return { mime: 'image/jpeg', ext: 'jpg' };
      }
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      ) {
        return { mime: 'image/png', ext: 'png' };
      }
      // GIF: GIF87a or GIF89a
      if (
        bytes[0] === 0x47 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x38 &&
        (bytes[4] === 0x37 || bytes[4] === 0x39) &&
        bytes[5] === 0x61
      ) {
        return { mime: 'image/gif', ext: 'gif' };
      }
      // WebP: RIFF....WEBP
      if (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      ) {
        return { mime: 'image/webp', ext: 'webp' };
      }
      // AVIF: ....ftypavif or ....ftypavis
      if (
        bytes[4] === 0x66 &&
        bytes[5] === 0x74 &&
        bytes[6] === 0x79 &&
        bytes[7] === 0x70 &&
        bytes[8] === 0x61 &&
        bytes[9] === 0x76 &&
        bytes[10] === 0x69 &&
        (bytes[11] === 0x66 || bytes[11] === 0x73)
      ) {
        return { mime: 'image/avif', ext: 'avif' };
      }
      return null;
    }

    async function timingSafePasswordCompare(inputPassword, expectedPassword) {
      if (typeof inputPassword !== 'string' || typeof expectedPassword !== 'string') {
        return false;
      }
      const encoder = new TextEncoder();
      const [inputHash, expectedHash] = await Promise.all([
        crypto.subtle.digest('SHA-256', encoder.encode(inputPassword)),
        crypto.subtle.digest('SHA-256', encoder.encode(expectedPassword)),
      ]);
      if (typeof crypto.subtle.timingSafeEqual === 'function') {
        return crypto.subtle.timingSafeEqual(inputHash, expectedHash);
      }
      const a = new Uint8Array(inputHash);
      const b = new Uint8Array(expectedHash);
      if (a.length !== b.length) return false;
      let diff = 0;
      for (let i = 0; i < a.length; i++) {
        diff |= a[i] ^ b[i];
      }
      return diff === 0;
    }

    function jsonResponse(data, status = 200, extraHeaders = {}) {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Vary': 'Sec-Fetch-Dest, Sec-Fetch-Mode, Sec-Fetch-Site',
        ...extraHeaders,
      });
      applySecurityHeaders(headers);
      return new Response(JSON.stringify(data), { status, headers });
    }

    function extractBearerToken(req) {
      const authHeader = req.headers.get('Authorization') || '';
      if (!authHeader.startsWith('Bearer ')) return '';
      const token = authHeader.slice(7).trim();
      // Validate token format to prevent arbitrary KV key probing
      if (!/^cadpi_[a-f0-9]{32}_[a-z0-9]+$/.test(token)) return '';
      return token;
    }

    async function verifyAdminAuth(req) {
      const token = extractBearerToken(req);
      if (!token) return false;

      if (env.BLOG_KV) {
        const session = await env.BLOG_KV.get('session:' + token);
        if (session) return true;
      }
      return false;
    }

    const DEFAULT_BLOG_POSTS = [
      {
        slug: 'tracing-hidden-assets-offshore-structures',
        title: 'Tracing Hidden Assets & Offshore Corporate Shells in High-Stakes Disputes',
        category: 'Financial Forensics',
        categorySlug: 'asset-tracing',
        date: 'Oct 2026',
        readTime: '5 min read',
        author: 'Michael Compitiello',
        authorRole: 'Founder & Supervisory Special Agent (Ret.)',
        avatarInitials: 'MC',
        excerpt:
          'How multi-layered LLCs, nominee trusts, and foreign accounts are systematically unraveled using federal financial tracing methodologies in matrimonial and corporate litigation.',
        bodyHtml: `<p>In high-net-worth matrimonial dissolutions, commercial partnership battles, and post-judgment enforcement, the most valuable assets rarely appear on transparent balance sheets. Individuals facing multimillion-dollar liability frequently employ deliberate, multi-layered corporate obfuscation strategies designed to stonewall standard discovery requests.</p>
<p>Throughout 26 years leading federal criminal and financial task forces at DHS/HSI—including supervising complex fraud rings and international kleptocracy asset seizures—our leadership proved one foundational rule: <em>money always leaves a digital and forensic footprint.</em></p>
<div class="article-quote">
  "Asset concealment is not magic; it is merely an architectural puzzle built on shell entities, nominee agreements, and banking friction. Given methodical forensic tracing, every layer can be peeled back."
</div>
<h3>The Anatomy of Modern Asset Concealment</h3>
<p>Sophisticated targets rarely rely on physical cash; instead, they construct intricate corporate shields across domestic and foreign jurisdictions:</p>
<ul>
  <li><strong>Domestic Privacy LLCs:</strong> Formed in statutory secrecy states like Wyoming, Delaware, or Nevada, where ultimate beneficial ownership (UBO) is deliberately obscured from public secretary of state portals.</li>
  <li><strong>Offshore Asset Protection Trusts (APTs):</strong> Established in Nevis, the Cook Islands, or Belize, frequently drafted with "flee clauses" that mandate immediate trustee relocation upon court scrutiny.</li>
  <li><strong>Collusive Liens &amp; Straw Encumbrances:</strong> Creating fictitious friendly loans and mortgages against prime real estate, making high-value assets appear underwater to creditors and spouses.</li>
  <li><strong>Digital Currency &amp; Cold Storage Layering:</strong> Dispersing liquid wealth across unhosted hardware wallets, non-KYC decentralized liquidity pools, and peer-to-peer exchanges.</li>
</ul>
<h3>Federal-Grade Forensic Tracing Methodologies</h3>
<p>Standard civil subpoenas only uncover assets counsel already knows to ask for. Federal-grade private investigation approaches the problem from the outside in:</p>
<h4>1. Source-and-Application Expenditure Audits</h4>
<p>By establishing a rigorous forensic baseline of historical declared income against verifiable lifestyle expenditures (private aviation, luxury automotive leases, country club memberships, and real estate upkeep), mathematical discrepancies emerge. When annual outlays surpass declared income by hundreds of thousands of dollars, courts are legally permitted to infer undisclosed revenue streams.</p>
<h4>2. Piercing Nominee Corporate Veilings</h4>
<p>We trace registered agent histories, commercial domain whois archives, UCC financing statements, and related entity filings. Nominee managers frequently recycle identical mail-drop addresses or signature patterns across dozens of holding entities, linking the target directly to concealed assets.</p>
<h4>3. Correspondent Banking &amp; SWIFT Wire Tracing</h4>
<p>Financial institutions rely on domestic correspondent accounts to settle international wire transfers. Tracing recurring round-dollar transfers through intermediary banks allows us to identify offshore beneficiary accounts and locate hidden capital repositories.</p>
<div class="article-takeaways">
  <div class="takeaways-heading">
    <i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Strategic Takeaways for Litigants &amp; Legal Counsel
  </div>
  <ul>
    <li><strong>Initiate asset tracing early:</strong> Move swiftly before assets can be layered through secondary Caribbean or South Pacific jurisdictions.</li>
    <li><strong>Challenge voluntary disclosure affidavits:</strong> Targets with intent to deceive routinely provide sworn affidavits omitting shell-held interests.</li>
    <li><strong>Leverage lifestyle audits in court:</strong> Demonstrating demonstrable lifestyle extravagance shifts the burden of proof to the concealing party under Arizona family and civil court standards.</li>
  </ul>
</div>
<p>Ultimately, raw financial intelligence is useless unless it withstands adversarial scrutiny. Every CAD Private Investigations asset tracing dossier is assembled to supervisory federal law enforcement standards—complete with certified document trails, timeline exhibits, and courtroom-ready expert witness testimony.</p>`,
        createdAt: 1790812800000,
        isCustom: true,
      },
      {
        slug: 'arizona-surveillance-law-admissibility-standards',
        title: 'Arizona Surveillance Law: Evidentiary Admissibility in Maricopa County Courts',
        category: 'Surveillance & Law',
        categorySlug: 'surveillance',
        date: 'Sep 2026',
        readTime: '4 min read',
        author: 'John Donofrio',
        authorRole: 'Operations Manager & Private Investigator',
        avatarInitials: 'JD',
        excerpt:
          'A critical analysis of A.R.S. § 13-3005, one-party consent parameters, reasonable expectation of privacy boundaries, and chain-of-custody protocols required to survive motion-in-limine challenges.',
        bodyHtml: `<p>Physical surveillance remains the most definitive evidentiary asset in domestic infidelity disputes, child custody hearings, personal injury defense, and corporate fraud litigation. However, a single statutory misstep can render hundreds of hours of high-definition video inadmissible under the Arizona Rules of Evidence—or worse, expose counsel and their clients to civil tort liability or criminal misdemeanor charges.</p>
<p>Operating in Maricopa County, Phoenix, and across Arizona demands absolute precision regarding statutory surveillance boundaries.</p>
<div class="article-quote">
  "Unassailable courtroom evidence requires both technical excellence in the field and strict adherence to Arizona privacy statutes. If evidence is gathered unlawfully, it is toxic to your case."
</div>
<h3>Arizona's One-Party Consent Rule (A.R.S. § 13-3005)</h3>
<p>Arizona is statutory a "one-party consent" state for recording conversations under A.R.S. § 13-3005. This allows an individual to record an oral or wire communication provided at least one participating party consents.</p>
<p><strong>The Critical Investigator Limitation:</strong> A private detective or client cannot plant an unattended audio recorder in a vehicle, office, or dining room where neither the investigator nor the client is physically present in the dialogue. Doing so constitutes felony eavesdropping. Video surveillance, however, operates under an entirely different legal standard: <em>the constitutional test of reasonable expectation of privacy.</em></p>
<h3>The Reasonable Expectation of Privacy Test (A.R.S. § 13-3019)</h3>
<p>Under A.R.S. § 13-3019 (Surreptitious Photographing, Videotaping, and Filming), capturing imagery of a person without consent is illegal only if the subject is in an area where they hold an objective, reasonable expectation of privacy.</p>
<ul>
  <li><strong>Public Domains:</strong> Any individual walking down Camelback Road, dining at a public outdoor patio in Scottsdale, or entering an office complex has no reasonable expectation of privacy. Visual evidence gathered from public easements is 100% lawful and admissible.</li>
  <li><strong>Private Curtilage:</strong> Aiming lenses into residential bedroom windows, using ladders or drones to peer over privacy perimeter walls, or trespassing into backyards violates Arizona law. Elite investigators position vehicles lawfully on public thoroughfares, capturing subjects only when they enter plain view.</li>
</ul>
<h3>GPS Tracking Restrictions (A.R.S. § 13-2923)</h3>
<p>One of the most frequent questions from prospective clients is whether a magnetic GPS tracker can be placed on an unfaithful spouse's vehicle. Under Arizona stalking statutes (A.R.S. § 13-2923), installing a tracking device on a vehicle without title ownership is unlawful.</p>
<p>In Arizona, GPS tracking is legally permissible <em>only</em> if the client's name appears on the legal vehicle title or registration (such as marital joint property). If the vehicle is titled exclusively in the other party's name, GPS placement is strictly prohibited without a court order—making manual, discreet physical mobile surveillance the only legal recourse.</p>
<div class="article-takeaways">
  <div class="takeaways-heading">
    <i class="fa-solid fa-scale-balanced" aria-hidden="true"></i> Best Practices for Surviving Motion in Limine Challenges
  </div>
  <ul>
    <li><strong>Preserve raw, unaltered native video files:</strong> Maintain digital master copies with embedded camera EXIF timestamps and SHA-256 hashes.</li>
    <li><strong>Maintain contemporaneous field logs:</strong> Every minute of surveillance must be recorded in an operational log detailing locations, weather, lighting, and investigator positioning.</li>
    <li><strong>Never use amateur GPS tracking:</strong> Tainted evidence can trigger severe judicial sanctions and compromise your entire legal strategy.</li>
  </ul>
</div>
<p>At CAD Private Investigations, all field surveillance operations are planned and executed to ensure that every minute of captured footage cleanly survives vigorous judicial cross-examination.</p>`,
        createdAt: 1788220800000,
        isCustom: true,
      },
      {
        slug: 'corporate-mergers-due-diligence-red-flags',
        title:
          'Red Flags in Corporate Mergers: Vetting Beneficial Ownership Beyond the Balance Sheet',
        category: 'Corporate Vetting',
        categorySlug: 'due-diligence',
        date: 'Aug 2026',
        readTime: '6 min read',
        author: 'Michael Compitiello',
        authorRole: 'Founder & Supervisory Special Agent (Ret.)',
        avatarInitials: 'MC',
        excerpt:
          'Why automated commercial checks fail to catch concealed regulatory sanctions, hidden litigation liabilities, and nominee director schemes before multimillion-dollar transactions close.',
        bodyHtml: `<p>During the excitement of corporate acquisitions, joint ventures, and capital investments, executive teams and private equity partners routinely rely on traditional CPA auditing firms and commercial background database subscriptions. While these audits verify reported P&amp;L statements and public corporate filings, they routinely miss hidden operational and reputational landmines.</p>
<p>Commercial databases only scan what is already indexed. Deep corporate vetting is not an accounting exercise—it is an intelligence operation designed to uncover undisclosed liabilities, hidden regulatory sanctions, and shadow beneficial owners before capital is committed.</p>
<div class="article-quote">
  "The greatest risks in corporate mergers are rarely on the balance sheet; they reside in what the founders and managing partners deliberately omitted from public view."
</div>
<h3>The Dangerous Blind Spots of Automated Screening Tools</h3>
<p>Automated database portals aggregate public records through robotic scrapers. In practice, their structural blind spots include:</p>
<ul>
  <li><strong>County-Level Docket Gaps:</strong> Thousands of municipal and county court jurisdictions across the United States do not syndicate civil dockets to commercial background databases. Active litigation can easily slip through automated checks.</li>
  <li><strong>Name Variation &amp; Entity Alias Obfuscation:</strong> Automated tools fail when principals alter legal spellings, utilize middle names, or register assets through slightly varied entity names across state lines.</li>
  <li><strong>Inability to Penetrate Nominee Directorships:</strong> Automated platforms report only the registered agent service listed on a Secretary of State filing, failing to identify the true controlling beneficial interest.</li>
</ul>
<h3>Five Critical Red Flags Discovered in Pre-Deal Vetting</h3>
<p>Our corporate investigations frequently expose warning signs that necessitate transaction restructuring or outright deal cancellation:</p>
<h4>1. Rapid Jurisdictional Charter Migration</h4>
<p>When an operating company repeatedly dissolves and re-incorporates in different states (e.g., Nevada to Delaware to Wyoming) within 24 to 36 months, the entity is almost always fleeing pending legal judgments, aggressive tax levies, or investigative scrutiny.</p>
<h4>2. Circular Related-Party Vendor Transactions</h4>
<p>Examining disbursement ledgers frequently uncovers substantial payments directed to secondary LLCs sharing registered agents, shared residential addresses, or common familial ties—effectively siphoning capital before acquisition.</p>
<h4>3. Informal Regulatory Subpoenas &amp; Warnings</h4>
<p>Long before the SEC, CFTC, EPA, or State Attorney General files a formal public lawsuit, regulatory bodies issue warning letters, informal inquiries, and target notices. These never appear on public balance sheets, yet represent existential business risk.</p>
<h4>4. Executive Pedigree &amp; Resume Fabrication</h4>
<p>Discrepancies in academic credentials, exaggerated previous executive tenures, or omitted bankruptcies and liquidated subsidiaries consistently correlate with broader managerial deception.</p>
<h4>5. Secondary Factoring Liens &amp; UCC Conflicts</h4>
<p>Concealed high-interest merchant cash advances and secondary factoring liens that jeopardize collateral priority for acquiring lenders and investors.</p>
<div class="article-takeaways">
  <div class="takeaways-heading">
    <i class="fa-solid fa-building-shield" aria-hidden="true"></i> Strategic Guidelines for Corporate Counsel &amp; Acquirers
  </div>
  <ul>
    <li><strong>Initiate investigative due diligence concurrently:</strong> Run private investigative inquiries in tandem with financial audits, not as a last-minute check right before closing.</li>
    <li><strong>Investigate silent partners and beneficial owners:</strong> Uncover the ultimate beneficiaries behind holding companies to avoid OFAC and federal sanctions violations.</li>
    <li><strong>Conduct discreet human source inquiries:</strong> Lawful, confidential interviews with former executives and suppliers uncover cultural and operational truths no spreadsheet can reveal.</li>
  </ul>
</div>
<p>CAD Private Investigations provides deal teams with deep, discrete intelligence that protects balance sheets, corporate reputation, and shareholder equity.</p>`,
        createdAt: 1785542400000,
        isCustom: true,
      },
      {
        slug: 'digital-forensics-insider-threat-data-theft',
        title:
          'Uncovering Insider Data Exfiltration: Digital Forensics in Corporate Trade Secret Theft',
        category: 'Digital Forensics',
        categorySlug: 'digital-forensics',
        date: 'Jul 2026',
        readTime: '5 min read',
        author: 'Alex Nader & Scott Unger',
        authorRole: 'Computer Forensic Specialists, CAD PI',
        avatarInitials: 'DF',
        excerpt:
          'From bit-stream hard drive imaging to USB artifact examination and cloud audit log reconstruction: how electronic evidence is captured to secure emergency injunctions.',
        bodyHtml: `<p>Over 70% of corporate trade secret and intellectual property thefts occur in the final 30 days preceding an employee’s departure. Whether a high-performing sales director downloading proprietary client pricing algorithms, an engineering lead copying confidential source code repositories, or an executive transferring strategic business plans to a competing venture, insider threats cost American enterprises billions in damages annually.</p>
<p>When leadership suspects data exfiltration, the clock begins ticking immediately. Critical forensic artifacts can be overwritten within days, and improper internal IT tampering often compromises the evidence before court filings.</p>
<div class="article-quote">
  "Departing employees believe that deleting browsing history or emptying the recycle bin erases their digital footprints. In modern operating systems, every file movement leaves an indelible forensic record."
</div>
<h3>Common Modern Data Exfiltration Vectors</h3>
<p>Rogue insiders rarely trigger conventional DLP alerts by sending massive email attachments. Instead, they exploit stealthier channels:</p>
<ul>
  <li><strong>High-Capacity USB &amp; Portable SSD Drives:</strong> Rapid bulk transfers initiated during off-hours, weekend shifts, or work-from-home remote desktop sessions.</li>
  <li><strong>Personal Cloud Synchronization:</strong> Uploading proprietary folder hierarchies to personal Dropbox, Google Drive, or Microsoft OneDrive accounts via browser sessions or unapproved client sync utilities.</li>
  <li><strong>AirDrop &amp; Wireless Peer-to-Peer Transfers:</strong> Direct transfers from corporate laptops to personal mobile devices, entirely bypassing local network perimeter firewalls.</li>
  <li><strong>Encrypted Archive Containers:</strong> Compressing corporate databases into multi-part, password-protected 7-Zip or RAR archives before transmitting via webmail.</li>
</ul>
<h3>Key Forensic Artifacts Examined in Digital Audits</h3>
<p>Our certified digital forensics specialists uncover evidence through rigorous operating system analysis:</p>
<h4>1. USB Registry Hives &amp; Volume Serial Identifiers</h4>
<p>Windows registry hives (<code>SYSTEM</code>, <code>SOFTWARE</code>) preserve an immutable log of every external USB drive ever connected to a machine—including manufacturer, model, unique device serial number, first connection date, and last disconnect timestamp.</p>
<h4>2. LNK Files &amp; Jump Lists</h4>
<p>When a user opens a confidential document directly from a connected USB flash drive, Windows automatically generates shortcut (LNK) files. These files document the exact file path, drive letter, and timestamp—proving the document was accessed from an external medium.</p>
<h4>3. Shellbags Analysis</h4>
<p>Shellbags are registry records that track folder view settings. Even if the external drive has been removed and destroyed, the host machine's Shellbags prove that the suspect browsed and opened specific folders on that external device.</p>
<div class="article-takeaways">
  <div class="takeaways-heading">
    <i class="fa-solid fa-laptop-code" aria-hidden="true"></i> Critical Protocol for Corporate Incident Response
  </div>
  <ul>
    <li><strong>Do not allow internal IT to 'browse' the suspect machine:</strong> Powering on a machine modifies thousands of system files and registry timestamps, handing opposing counsel grounds to claim evidence spoliation.</li>
    <li><strong>Isolate and preserve devices immediately:</strong> Quarantine the suspect laptop, phone, and company-issued tablets in secure physical custody.</li>
    <li><strong>Create bit-stream forensic images:</strong> Extract forensically verified bit-stream images with SHA-256 cryptographic hashes compliant with ISO/IEC 27037 standards.</li>
  </ul>
</div>
<p>Our forensic team provides sworn Rule 702 Expert Witness Reports detailing exact timelines and file movements, empowering legal counsel to secure emergency Temporary Restraining Orders (TROs) and preliminary injunctions.</p>`,
        createdAt: 1782864000000,
        isCustom: true,
      },
    ];

    async function ensureDefaultPostsSeeded() {
      if (!env.BLOG_KV) return;
      const seeded = await env.BLOG_KV.get('posts:defaults_seeded');
      if (seeded === 'v1') return;

      const indexRaw = await env.BLOG_KV.get('posts:index');
      let index = indexRaw ? JSON.parse(indexRaw) : [];

      for (const defPost of DEFAULT_BLOG_POSTS) {
        const existing = await env.BLOG_KV.get('post:' + defPost.slug);
        if (!existing) {
          await env.BLOG_KV.put('post:' + defPost.slug, JSON.stringify(defPost));
        }
        if (!index.includes(defPost.slug)) {
          index.push(defPost.slug);
        }
      }

      await env.BLOG_KV.put('posts:index', JSON.stringify(index));
      await env.BLOG_KV.put('posts:defaults_seeded', 'v1');
    }

    // --- API ROUTES ---
    if (url.pathname.startsWith('/api/')) {
      // Enforce Fetch Metadata resource isolation on admin endpoints before auth checks
      if (url.pathname.startsWith('/api/admin/')) {
        const secFetchSite = request.headers.get('Sec-Fetch-Site');
        if (secFetchSite && !['same-origin', 'same-site', 'none'].includes(secFetchSite)) {
          return jsonResponse({ success: false, error: 'Cross-site request forbidden' }, 403);
        }
      }

      // 1. GET /api/posts - Get all published posts
      if (request.method === 'GET' && url.pathname === '/api/posts') {
        if (!env.BLOG_KV) {
          return jsonResponse({ success: true, posts: DEFAULT_BLOG_POSTS });
        }
        try {
          await ensureDefaultPostsSeeded();
          const indexRaw = await env.BLOG_KV.get('posts:index');
          const index = indexRaw ? JSON.parse(indexRaw) : [];
          const posts = [];
          for (const slug of index) {
            const postRaw = await env.BLOG_KV.get('post:' + slug);
            if (postRaw) {
              try {
                const parsed = JSON.parse(postRaw);
                parsed.bodyHtml = sanitizeBlogHtml(parsed.bodyHtml);
                posts.push(parsed);
              } catch (e) {}
            }
          }
          return jsonResponse({ success: true, posts });
        } catch (err) {
          return jsonResponse({ success: false, error: 'Failed to load posts', posts: [] }, 500);
        }
      }

      // 2. POST /api/admin/login
      if (request.method === 'POST' && url.pathname === '/api/admin/login') {
        if (!env.ADMIN_PASSWORD) {
          return jsonResponse(
            { success: false, error: 'Admin authentication is not configured on the server' },
            503
          );
        }

        const clientIp = (request.headers.get('CF-Connecting-IP') || 'unknown').trim();
        const rateLimitKey = `ratelimit:login:${clientIp}`;
        const MAX_LOGIN_ATTEMPTS = 5;
        const RATE_LIMIT_TTL_SECONDS = 15 * 60; // 15 minutes

        let currentAttempts = 0;
        if (env.BLOG_KV) {
          try {
            const rawAttempts = await env.BLOG_KV.get(rateLimitKey);
            if (rawAttempts) {
              currentAttempts = parseInt(rawAttempts, 10) || 0;
            }
          } catch (e) {}

          if (currentAttempts >= MAX_LOGIN_ATTEMPTS) {
            return jsonResponse(
              {
                success: false,
                error: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
              },
              429,
              { 'Retry-After': String(RATE_LIMIT_TTL_SECONDS) }
            );
          }
        }

        try {
          await ensureDefaultPostsSeeded();
          const body = await request.json();
          const candidatePassword = typeof body?.password === 'string' ? body.password : '';
          const isValid =
            candidatePassword.length > 0 &&
            (await timingSafePasswordCompare(candidatePassword, env.ADMIN_PASSWORD));

          if (!isValid) {
            if (env.BLOG_KV) {
              await env.BLOG_KV.put(rateLimitKey, String(currentAttempts + 1), {
                expirationTtl: RATE_LIMIT_TTL_SECONDS,
              });
            }
            return jsonResponse({ success: false, error: 'Invalid admin credentials' }, 401);
          }

          // Clear failed login counter on successful authentication
          if (env.BLOG_KV && currentAttempts > 0) {
            await env.BLOG_KV.delete(rateLimitKey);
          }

          const token =
            'cadpi_' + crypto.randomUUID().replace(/-/g, '') + '_' + Date.now().toString(36);
          if (env.BLOG_KV) {
            // Expire token in 7 days
            await env.BLOG_KV.put(
              'session:' + token,
              JSON.stringify({ createdAt: Date.now() }),
              {
                expirationTtl: 60 * 60 * 24 * 7,
              }
            );
          }

          return jsonResponse({ success: true, token });
        } catch (e) {
          return jsonResponse({ success: false, error: 'Malformed request' }, 400);
        }
      }

      // 3. POST /api/admin/logout - Revoke session in KV and clear site storage
      if (request.method === 'POST' && url.pathname === '/api/admin/logout') {
        const token = extractBearerToken(request);
        if (token && env.BLOG_KV) {
          await env.BLOG_KV.delete('session:' + token);
        }
        return jsonResponse({ success: true, loggedOut: true }, 200, {
          'Clear-Site-Data': '"storage"',
        });
      }

      // 4. GET /api/admin/verify
      if (request.method === 'GET' && url.pathname === '/api/admin/verify') {
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) {
          return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
        }
        return jsonResponse({ success: true, authenticated: true });
      }

      // 4b. GET /api/media/:id - Serve uploaded blog images from KV
      if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname.startsWith('/api/media/')) {
        if (!env.BLOG_KV) {
          return new Response('Not Found', { status: 404 });
        }
        const mediaId = decodeURIComponent(url.pathname.replace('/api/media/', '').trim());
        if (!/^img_[a-z0-9]+_[a-f0-9]+\.(jpg|jpeg|png|webp|gif|avif)$/i.test(mediaId)) {
          return new Response('Not Found', { status: 404 });
        }
        const { value, metadata } = await env.BLOG_KV.getWithMetadata('media:' + mediaId, {
          type: 'arrayBuffer',
        });
        if (!value) {
          return new Response('Not Found', { status: 404 });
        }
        const allowedMimes = new Set([
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'image/avif',
        ]);
        const contentType =
          metadata?.contentType && allowedMimes.has(metadata.contentType)
            ? metadata.contentType
            : 'image/jpeg';

        const imgHeaders = new Headers({
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Disposition': 'inline',
          'Cross-Origin-Resource-Policy': 'same-origin',
        });
        applySecurityHeaders(imgHeaders);
        return new Response(value, { status: 200, headers: imgHeaders });
      }

      // 4c. POST /api/admin/media - Upload image to Cloudflare KV
      if (request.method === 'POST' && url.pathname === '/api/admin/media') {
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) {
          return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
        }
        if (!env.BLOG_KV) {
          return jsonResponse({ success: false, error: 'KV storage not configured' }, 500);
        }

        try {
          const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB max
          const reqContentType = request.headers.get('Content-Type') || '';
          let arrayBuffer = null;
          let originalName = 'image';
          let width = null;
          let height = null;

          if (reqContentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file');
            if (!file || typeof file.arrayBuffer !== 'function') {
              return jsonResponse({ success: false, error: 'No image file provided' }, 400);
            }
            originalName = String(file.name || 'image').slice(0, 120);
            width = parseInt(formData.get('width'), 10) || null;
            height = parseInt(formData.get('height'), 10) || null;
            arrayBuffer = await file.arrayBuffer();
          } else {
            const body = await request.json();
            if (!body || typeof body.dataBase64 !== 'string') {
              return jsonResponse({ success: false, error: 'Invalid image upload payload' }, 400);
            }
            originalName = String(body.filename || 'image').slice(0, 120);
            width = parseInt(body.width, 10) || null;
            height = parseInt(body.height, 10) || null;
            const cleanBase64 = body.dataBase64.replace(/^data:[^;]+;base64,/, '');
            const binaryStr = atob(cleanBase64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            arrayBuffer = bytes.buffer;
          }

          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            return jsonResponse({ success: false, error: 'Empty image file' }, 400);
          }
          if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
            return jsonResponse(
              { success: false, error: 'Image exceeds maximum size limit (8 MB)' },
              413
            );
          }

          const byteView = new Uint8Array(arrayBuffer);
          const detected = detectImageMimeFromBytes(byteView);
          if (!detected) {
            return jsonResponse(
              {
                success: false,
                error:
                  'Unsupported or invalid image format. Allowed formats: JPG, PNG, WebP, GIF, AVIF.',
              },
              400
            );
          }

          const mediaId = `img_${Date.now().toString(36)}_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}.${detected.ext}`;
          await env.BLOG_KV.put('media:' + mediaId, arrayBuffer, {
            metadata: {
              contentType: detected.mime,
              filename: originalName,
              size: arrayBuffer.byteLength,
              width,
              height,
              createdAt: Date.now(),
            },
          });

          const urlPath = `/api/media/${mediaId}`;
          return jsonResponse({
            success: true,
            id: mediaId,
            url: urlPath,
            contentType: detected.mime,
            size: arrayBuffer.byteLength,
            width,
            height,
          });
        } catch (err) {
          return jsonResponse({ success: false, error: 'Failed to process image upload' }, 500);
        }
      }

      // 5. POST /api/admin/posts or PUT /api/admin/posts/:slug
      if (
        (request.method === 'POST' && url.pathname === '/api/admin/posts') ||
        (request.method === 'PUT' && url.pathname.startsWith('/api/admin/posts/'))
      ) {
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) {
          return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
        }
        if (!env.BLOG_KV) {
          return jsonResponse({ success: false, error: 'KV storage not configured' }, 500);
        }

        try {
          await ensureDefaultPostsSeeded();
          const body = await request.json();
          if (!body.title || !body.bodyHtml) {
            return jsonResponse({ success: false, error: 'Title and content are required' }, 400);
          }

          function getCategorySlug(cat) {
            const lower = (cat || '').toLowerCase();
            if (lower.includes('financ') || lower.includes('asset')) return 'asset-tracing';
            if (lower.includes('surveill')) return 'surveillance';
            if (
              lower.includes('vetting') ||
              lower.includes('diligence') ||
              lower.includes('merger') ||
              lower.includes('corporate')
            )
              return 'due-diligence';
            if (
              lower.includes('cyber') ||
              lower.includes('digital') ||
              (lower.includes('forensic') && !lower.includes('financ'))
            )
              return 'digital-forensics';
            return lower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
          }

          const pathSlug =
            request.method === 'PUT'
              ? decodeURIComponent(url.pathname.replace('/api/admin/posts/', '').trim())
              : '';
          const rawSlug = (pathSlug || body.slug || body.title)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          const slug = rawSlug || 'post-' + Date.now();

          let existingPost = null;
          const existingRaw = await env.BLOG_KV.get('post:' + slug);
          if (existingRaw) {
            try {
              existingPost = JSON.parse(existingRaw);
            } catch (e) {}
          }

          const cleanBodyHtml = sanitizeBlogHtml(body.bodyHtml);

          // Approximate read time
          const wordCount = cleanBodyHtml
            .replace(/<[^>]+>/g, ' ')
            .split(/\s+/)
            .filter(Boolean).length;
          const readTime = body.readTime || `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

          // Date format (preserve original published date when editing unless explicitly supplied)
          const date =
            body.date ||
            existingPost?.date ||
            new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

          // Category slug
          const category = String(body.category || 'Investigative Briefing').trim();
          const categorySlug = body.categorySlug || getCategorySlug(category);

          // Author initials
          const author = String(body.author || 'Michael Compitiello').trim();
          const authorRole = String(body.authorRole || 'Supervisory Special Agent (Ret.)').trim();
          const avatarInitials =
            author
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'PI';

          const post = {
            slug,
            title: String(body.title).trim(),
            category,
            categorySlug,
            date: String(date).trim(),
            readTime: String(readTime).trim(),
            author,
            authorRole,
            avatarInitials,
            excerpt:
              String(body.excerpt || '').trim() ||
              cleanBodyHtml.replace(/<[^>]+>/g, ' ').slice(0, 180).trim() + '...',
            bodyHtml: cleanBodyHtml,
            createdAt: existingPost?.createdAt || Date.now(),
            updatedAt: Date.now(),
            isCustom: true,
          };

          // Save post
          await env.BLOG_KV.put('post:' + slug, JSON.stringify(post));

          // Update index (preserve position if already in index; prepend if new)
          const indexRaw = await env.BLOG_KV.get('posts:index');
          let index = indexRaw ? JSON.parse(indexRaw) : [];
          if (!index.includes(slug)) {
            index = [slug, ...index];
            await env.BLOG_KV.put('posts:index', JSON.stringify(index));
          }

          return jsonResponse({ success: true, post, updated: Boolean(existingPost) });
        } catch (e) {
          return jsonResponse({ success: false, error: 'Failed to publish post' }, 500);
        }
      }

      // 6. DELETE /api/admin/posts/:slug
      if (request.method === 'DELETE' && url.pathname.startsWith('/api/admin/posts/')) {
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) {
          return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
        }
        if (!env.BLOG_KV) {
          return jsonResponse({ success: false, error: 'KV storage not configured' }, 500);
        }

        const rawSlug = url.pathname.replace('/api/admin/posts/', '').trim();
        const slug = decodeURIComponent(rawSlug).replace(/[^a-z0-9-]/gi, '');
        if (!slug) {
          return jsonResponse({ success: false, error: 'Slug required' }, 400);
        }

        await ensureDefaultPostsSeeded();
        await env.BLOG_KV.delete('post:' + slug);

        const indexRaw = await env.BLOG_KV.get('posts:index');
        if (indexRaw) {
          let index = JSON.parse(indexRaw);
          index = index.filter((s) => s !== slug);
          await env.BLOG_KV.put('posts:index', JSON.stringify(index));
        }

        return jsonResponse({ success: true, deleted: slug });
      }

      return jsonResponse({ error: 'Endpoint not found' }, 404);
    }

    // --- BLOCK INTERNAL / SENSITIVE FILES FROM STATIC SERVING ---
    const lowerPath = decodeURIComponent(url.pathname).toLowerCase();
    const isBlockedPath =
      lowerPath.startsWith('/.') ||
      lowerPath.includes('/.') ||
      lowerPath === '/worker.js' ||
      lowerPath === '/wrangler.json' ||
      lowerPath === '/wrangler.toml' ||
      lowerPath === '/vite.config.js' ||
      lowerPath === '/package.json' ||
      lowerPath === '/package-lock.json' ||
      lowerPath === '/_headers' ||
      lowerPath.startsWith('/scratch') ||
      lowerPath.startsWith('/holding-site') ||
      lowerPath.startsWith('/node_modules') ||
      /\.(md|py|sh|toml|env|bak|log)$/i.test(lowerPath);

    if (isBlockedPath) {
      const blockedHeaders = new Headers({ 'Content-Type': 'text/plain; charset=utf-8' });
      applySecurityHeaders(blockedHeaders);
      return new Response('Not Found', { status: 404, headers: blockedHeaders });
    }

    // --- STATIC ASSET SERVING & CLEAN URL ROUTING ---
    if (env.ASSETS) {
      let assetRequest = request;
      const cleanPath = url.pathname.replace(/\/$/, '');

      if (
        cleanPath === '/privacy' ||
        cleanPath === '/terms' ||
        cleanPath === '/terms-and-conditions'
      ) {
        assetRequest = new Request(new URL('/privacy-policy', request.url), request);
      }

      // If it's a blog post request, check dynamic KV posts first so edits/deletes apply to all dispatches
      if (cleanPath.startsWith('/blog/') && env.BLOG_KV) {
        await ensureDefaultPostsSeeded();
        const slug = cleanPath
          .replace('/blog/', '')
          .replace('.html', '')
          .trim()
          .replace(/[^a-z0-9-]/gi, '');
        const postRaw = slug ? await env.BLOG_KV.get('post:' + slug) : null;
        if (postRaw) {
          try {
            const post = JSON.parse(postRaw);
            const safeSlug = encodeURIComponent(post.slug || slug);
            const safeTitle = escapeHtml(post.title);
            const safeExcerpt = escapeHtml(post.excerpt || post.title);
            const safeCategory = escapeHtml(post.category || 'Briefing');
            const safeDate = escapeHtml(post.date || '');
            const safeReadTime = escapeHtml(post.readTime || '');
            const safeAuthor = escapeHtml(post.author || 'Michael Compitiello');
            const safeAuthorRole = escapeHtml(post.authorRole || 'Investigator, CAD PI');
            const safeInitials = escapeHtml(post.avatarInitials || 'PI');
            const safeBodyHtml = sanitizeBlogHtml(post.bodyHtml);

            const structuredDataJson = JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BlogPosting',
              headline: post.title || '',
              url: `https://cadprivateinvestigations.com/blog/${safeSlug}.html`,
              datePublished: post.date || '',
              author: {
                '@type': 'Person',
                name: post.author || 'Michael Compitiello',
              },
              publisher: {
                '@type': 'Organization',
                name: 'Compitiello & Donofrio Private Investigations',
                logo: 'https://cadprivateinvestigations.com/assets/logo_horizontal_v7.png',
              },
            }).replace(/</g, '\\u003c');

            const dynamicHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle} | Compitiello &amp; Donofrio PI</title>
  <meta name="description" content="${safeExcerpt}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <link rel="canonical" href="https://cadprivateinvestigations.com/blog/${safeSlug}.html">
  <link rel="icon" type="image/x-icon" href="../favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="../assets/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="../assets/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="../assets/favicon-16x16.png">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeExcerpt}">
  <meta property="og:image" content="https://cadprivateinvestigations.com/assets/hero_background_desert.jpg">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://cadprivateinvestigations.com/blog/${safeSlug}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==" crossorigin="anonymous" referrerpolicy="no-referrer">
  <link rel="stylesheet" href="../index.css?v=1.2.3">
  <script type="application/ld+json">${structuredDataJson}</script>
</head>
<body>
  <header class="global-header">
    <div id="scroll-progress" class="scroll-progress-bar" aria-hidden="true"></div>
    <div class="header-container">
      <a href="../index.html#home" class="logo" aria-label="Compitiello &amp; Donofrio Private Investigations Home">
        <img src="../assets/logo_horizontal_v7.png" alt="Compitiello &amp; Donofrio Private Investigations Logo" class="logo-img">
      </a>
      <nav id="main-navigation" class="nav-menu">
        <ul class="nav-list">
          <li><a href="../index.html#home" class="nav-link">Home</a></li>
          <li><a href="../index.html#about" class="nav-link">Our Difference</a></li>
          <li><a href="../index.html#services" class="nav-link">Our Services</a></li>
          <li><a href="../index.html#testimonials" class="nav-link">Reviews</a></li>
          <li><a href="../index.html#team" class="nav-link">Our Team</a></li>
          <li><a href="../blog.html" class="nav-link active">Blog</a></li>
          <li><a href="../index.html#contact" class="nav-link">Contact Us</a></li>
        </ul>
      </nav>
      <div class="header-actions">
        <a href="../index.html#contact" class="btn btn-gold btn-header">Schedule A Free Consultation</a>
        <button type="button" id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle between Day and Night mode">
          <i class="fa-solid fa-sun sun-icon" aria-hidden="true"></i>
          <i class="fa-solid fa-moon moon-icon" aria-hidden="true"></i>
        </button>
      </div>
      <button class="mobile-toggle" aria-expanded="false" aria-controls="main-navigation" aria-label="Toggle navigation menu">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>
    </div>
  </header>
  <main id="main-content">
    <article class="section-container" style="padding-top: calc(var(--header-height) + 2.5rem); padding-bottom: 4rem;">
      <div style="max-width: 860px; margin: 0 auto;">
        <nav class="blog-breadcrumb" aria-label="Breadcrumb navigation">
          <a href="../index.html">Home</a>
          <span aria-hidden="true">/</span>
          <a href="../blog.html">Blog &amp; Dispatches</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">${safeTitle}</span>
        </nav>
        <div style="margin-bottom: 2rem;">
          <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem;">
            <span class="blog-tag"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> ${safeCategory}</span>
            <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${safeDate}</span>
            <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${safeReadTime}</span>
          </div>
          <h1 class="article-full-title" style="font-size: clamp(1.85rem, 3.5vw, 2.75rem); line-height: 1.25; margin-bottom: 1.5rem;">
            ${safeTitle}
          </h1>
          <div class="article-author-card" style="margin-bottom: 2.5rem;">
            <div class="author-avatar-lg" aria-hidden="true">${safeInitials}</div>
            <div class="author-details">
              <div class="author-name-lg">${safeAuthor}</div>
              <div class="author-role-lg">${safeAuthorRole}</div>
            </div>
          </div>
        </div>
        <div class="article-full-body glass-card legal-card">
          ${safeBodyHtml}
          <div class="article-cta-box glass-card" style="margin-top: 3rem;">
            <div class="cta-box-badge">CONFIDENTIAL CASE REVIEW</div>
            <h3 class="cta-box-title">Require Expert Investigative Counsel?</h3>
            <p class="cta-box-desc">
              Whether preparing for complex civil litigation, corporate fraud investigation, or surveillance, CAD Private Investigations provides federal-grade precision.
            </p>
            <div class="cta-box-actions" style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <a href="../index.html#contact" class="btn btn-gold modal-contact-btn">Schedule A Confidential Consultation</a>
              <a href="../index.html#services" class="btn btn-outline">Explore Our Services</a>
            </div>
          </div>
        </div>
      </div>
    </article>
  </main>
  <footer class="global-footer">
    <div class="footer-container">
      <div class="footer-bottom">
        <p class="copyright-text">&copy; 2026 Compitiello &amp; Donofrio Private Investigations | All Rights Reserved.</p>
      </div>
    </div>
  </footer>
  <script src="../index.js?v=1.2.0"></script>
</body>
</html>`;
            const dynHeaders = new Headers({ 'Content-Type': 'text/html; charset=utf-8' });
            applySecurityHeaders(dynHeaders);
            return new Response(dynamicHtml, { status: 200, headers: dynHeaders });
          } catch (e) {}
        }
        const notFoundHeaders = new Headers({ 'Content-Type': 'text/plain; charset=utf-8' });
        applySecurityHeaders(notFoundHeaders);
        return new Response('Not Found', { status: 404, headers: notFoundHeaders });
      }

      const response = await env.ASSETS.fetch(assetRequest);

      const newHeaders = new Headers(response.headers);
      applySecurityHeaders(newHeaders);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    const notFoundHeaders = new Headers({ 'Content-Type': 'text/plain; charset=utf-8' });
    applySecurityHeaders(notFoundHeaders);
    return new Response('Not Found', { status: 404, headers: notFoundHeaders });
  },
};
