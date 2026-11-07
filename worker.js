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
      return html.trim();
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

    // --- API ROUTES ---
    if (url.pathname.startsWith('/api/')) {
      // Enforce Fetch Metadata resource isolation on admin endpoints before auth checks
      if (url.pathname.startsWith('/api/admin/')) {
        const secFetchSite = request.headers.get('Sec-Fetch-Site');
        if (secFetchSite && !['same-origin', 'same-site', 'none'].includes(secFetchSite)) {
          return jsonResponse({ success: false, error: 'Cross-site request forbidden' }, 403);
        }
      }

      // 1. GET /api/posts - Get all dynamic published posts
      if (request.method === 'GET' && url.pathname === '/api/posts') {
        if (!env.BLOG_KV) {
          return jsonResponse({ success: true, posts: [] });
        }
        try {
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

      // 5. POST /api/admin/posts
      if (request.method === 'POST' && url.pathname === '/api/admin/posts') {
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) {
          return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
        }
        if (!env.BLOG_KV) {
          return jsonResponse({ success: false, error: 'KV storage not configured' }, 500);
        }

        try {
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

          const rawSlug = (body.slug || body.title)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          const slug = rawSlug || 'post-' + Date.now();

          const cleanBodyHtml = sanitizeBlogHtml(body.bodyHtml);

          // Approximate read time
          const wordCount = cleanBodyHtml
            .replace(/<[^>]+>/g, ' ')
            .split(/\s+/)
            .filter(Boolean).length;
          const readTime = body.readTime || `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

          // Date format
          const date =
            body.date ||
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
            createdAt: Date.now(),
            isCustom: true,
          };

          // Save post
          await env.BLOG_KV.put('post:' + slug, JSON.stringify(post));

          // Update index
          const indexRaw = await env.BLOG_KV.get('posts:index');
          let index = indexRaw ? JSON.parse(indexRaw) : [];
          index = [slug, ...index.filter((s) => s !== slug)];
          await env.BLOG_KV.put('posts:index', JSON.stringify(index));

          return jsonResponse({ success: true, post });
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

      const response = await env.ASSETS.fetch(assetRequest);

      // If static file not found and it's a blog post request, check dynamic KV posts
      if (response.status === 404 && cleanPath.startsWith('/blog/') && env.BLOG_KV) {
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
      }

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
