export default {
  async fetch(request, env, ctx) {
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      
      // Security headers for 100% security rating
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      newHeaders.set('X-Content-Type-Options', 'nosniff');
      newHeaders.set('X-Frame-Options', 'DENY');
      newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
      newHeaders.set('X-XSS-Protection', '1; mode=block');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
