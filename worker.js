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

    // --- STATIC ASSET SERVING ---
    if (env.ASSETS) {
      let assetRequest = request;
      if (url.pathname === '/blog' || url.pathname === '/blog/') {
        const blogUrl = new URL('/blog.html', request.url);
        assetRequest = new Request(blogUrl, request);
      } else if (url.pathname === '/admin' || url.pathname === '/admin/') {
        const adminUrl = new URL('/admin.html', request.url);
        assetRequest = new Request(adminUrl, request);
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

    return new Response('Not Found', { status: 404 });
  },
};
