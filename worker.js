export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Security headers helper
    function applySecurityHeaders(headers) {
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
      headers.set('X-XSS-Protection', '1; mode=block');
    }

    function jsonResponse(data, status = 200) {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      });
      applySecurityHeaders(headers);
      return new Response(JSON.stringify(data), { status, headers });
    }

    async function verifyAdminAuth(req) {
      const authHeader = req.headers.get('Authorization') || '';
      if (!authHeader.startsWith('Bearer ')) return false;
      const token = authHeader.slice(7).trim();
      if (!token) return false;

      // Verify token in KV
      if (env.BLOG_KV) {
        const session = await env.BLOG_KV.get('session:' + token);
        if (session) return true;
      }
      return false;
    }

    // --- API ROUTES ---
    if (url.pathname.startsWith('/api/')) {
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
                posts.push(JSON.parse(postRaw));
              } catch (e) {}
            }
          }
          return jsonResponse({ success: true, posts });
        } catch (err) {
          return jsonResponse({ success: false, error: err.message, posts: [] }, 500);
        }
      }

      // 2. POST /api/admin/login
      if (request.method === 'POST' && url.pathname === '/api/admin/login') {
        try {
          const body = await request.json();
          const expectedPassword = env.ADMIN_PASSWORD || 'cadpi-admin-2026!';
          if (!body.password || body.password !== expectedPassword) {
            return jsonResponse({ success: false, error: 'Invalid admin credentials' }, 401);
          }

          const token = 'cadpi_' + crypto.randomUUID().replace(/-/g, '') + '_' + Date.now().toString(36);
          if (env.BLOG_KV) {
            // Expire token in 7 days
            await env.BLOG_KV.put('session:' + token, JSON.stringify({ createdAt: Date.now() }), {
              expirationTtl: 60 * 60 * 24 * 7,
            });
          }

          return jsonResponse({ success: true, token });
        } catch (e) {
          return jsonResponse({ success: false, error: 'Malformed request' }, 400);
        }
      }

      // 3. GET /api/admin/verify
      if (request.method === 'GET' && url.pathname === '/api/admin/verify') {
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) {
          return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
        }
        return jsonResponse({ success: true, authenticated: true });
      }

      // 4. POST /api/admin/posts
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
            if (lower.includes('vetting') || lower.includes('diligence') || lower.includes('merger') || lower.includes('corporate')) return 'due-diligence';
            if (lower.includes('cyber') || lower.includes('digital') || (lower.includes('forensic') && !lower.includes('financ'))) return 'digital-forensics';
            return lower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
          }

          const rawSlug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const slug = rawSlug || 'post-' + Date.now();

          // Approximate read time
          const wordCount = body.bodyHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
          const readTime = body.readTime || `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

          // Date format
          const date = body.date || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

          // Category slug
          const category = body.category || 'Investigative Briefing';
          const categorySlug = body.categorySlug || getCategorySlug(category);

          // Author initials
          const author = body.author || 'Michael Compitiello';
          const authorRole = body.authorRole || 'Supervisory Special Agent (Ret.)';
          const avatarInitials = author.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'PI';

          const post = {
            slug,
            title: body.title.trim(),
            category,
            categorySlug,
            date,
            readTime,
            author,
            authorRole,
            avatarInitials,
            excerpt: body.excerpt || body.bodyHtml.replace(/<[^>]+>/g, ' ').slice(0, 180).trim() + '...',
            bodyHtml: body.bodyHtml.trim(),
            createdAt: Date.now(),
            isCustom: true,
          };

          // Save post
          await env.BLOG_KV.put('post:' + slug, JSON.stringify(post));

          // Update index
          const indexRaw = await env.BLOG_KV.get('posts:index');
          let index = indexRaw ? JSON.parse(indexRaw) : [];
          index = [slug, ...index.filter(s => s !== slug)];
          await env.BLOG_KV.put('posts:index', JSON.stringify(index));

          return jsonResponse({ success: true, post });
        } catch (e) {
          return jsonResponse({ success: false, error: e.message }, 500);
        }
      }

      // 5. DELETE /api/admin/posts/:slug
      if (request.method === 'DELETE' && url.pathname.startsWith('/api/admin/posts/')) {
        const isAuthed = await verifyAdminAuth(request);
        if (!isAuthed) {
          return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
        }
        if (!env.BLOG_KV) {
          return jsonResponse({ success: false, error: 'KV storage not configured' }, 500);
        }

        const rawSlug = url.pathname.replace('/api/admin/posts/', '').trim();
        const slug = decodeURIComponent(rawSlug);
        if (!slug) {
          return jsonResponse({ success: false, error: 'Slug required' }, 400);
        }

        await env.BLOG_KV.delete('post:' + slug);

        const indexRaw = await env.BLOG_KV.get('posts:index');
        if (indexRaw) {
          let index = JSON.parse(indexRaw);
          index = index.filter(s => s !== slug);
          await env.BLOG_KV.put('posts:index', JSON.stringify(index));
        }

        return jsonResponse({ success: true, deleted: slug });
      }

      return jsonResponse({ error: 'Endpoint not found' }, 404);
    }

    // --- STATIC ASSET SERVING & CLEAN URL ROUTING ---
    if (env.ASSETS) {
      let assetRequest = request;
      const cleanPath = url.pathname.replace(/\/$/, '');

      if (
        cleanPath === '/privacy' ||
        cleanPath === '/terms' || cleanPath === '/terms-and-conditions'
      ) {
        assetRequest = new Request(new URL('/privacy-policy', request.url), request);
      }

      const response = await env.ASSETS.fetch(assetRequest);

      // If static file not found and it's a blog post request, check dynamic KV posts
      if (response.status === 404 && cleanPath.startsWith('/blog/') && env.BLOG_KV) {
        const slug = cleanPath.replace('/blog/', '').replace('.html', '').trim();
        const postRaw = await env.BLOG_KV.get('post:' + slug);
        if (postRaw) {
          try {
            const post = JSON.parse(postRaw);
            const dynamicHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${post.title} | Compitiello &amp; Donofrio PI</title>
  <meta name="description" content="${(post.excerpt || post.title).replace(/"/g, '&quot;')}">
  <link rel="canonical" href="https://cadprivateinvestigations.com/blog/${post.slug}.html">
  <link rel="icon" type="image/x-icon" href="../favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="../assets/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="../assets/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="../assets/favicon-16x16.png">
  <meta property="og:title" content="${post.title.replace(/"/g, '&quot;')}">
  <meta property="og:description" content="${(post.excerpt || post.title).replace(/"/g, '&quot;')}">
  <meta property="og:image" content="https://cadprivateinvestigations.com/assets/hero_background_desert.jpg">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://cadprivateinvestigations.com/blog/${post.slug}.html">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="stylesheet" href="../index.css?v=1.2.3">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${post.title.replace(/"/g, '\\"')}",
    "url": "https://cadprivateinvestigations.com/blog/${post.slug}.html",
    "datePublished": "${post.date || ''}",
    "author": {
      "@type": "Person",
      "name": "${(post.author || 'Michael Compitiello').replace(/"/g, '\\"')}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Compitiello & Donofrio Private Investigations",
      "logo": "https://cadprivateinvestigations.com/assets/logo_horizontal_v7.png"
    }
  }
  </script>
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
          <span aria-current="page">${post.title}</span>
        </nav>
        <div style="margin-bottom: 2rem;">
          <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem;">
            <span class="blog-tag"><i class="fa-solid fa-shield-halved" aria-hidden="true"></i> ${post.category || 'Briefing'}</span>
            <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${post.date || ''}</span>
            <span style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${post.readTime || ''}</span>
          </div>
          <h1 class="article-full-title" style="font-size: clamp(1.85rem, 3.5vw, 2.75rem); line-height: 1.25; margin-bottom: 1.5rem;">
            ${post.title}
          </h1>
          <div class="article-author-card" style="margin-bottom: 2.5rem;">
            <div class="author-avatar-lg" aria-hidden="true">${post.avatarInitials || 'PI'}</div>
            <div class="author-details">
              <div class="author-name-lg">${post.author || 'Michael Compitiello'}</div>
              <div class="author-role-lg">${post.authorRole || 'Investigator, CAD PI'}</div>
            </div>
          </div>
        </div>
        <div class="article-full-body glass-card legal-card">
          ${post.bodyHtml}
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

    return new Response('Not Found', { status: 404 });
  },
};
