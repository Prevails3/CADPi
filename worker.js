export default {
  async fetch(request, env, ctx) {
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      
      // Clone response to attach standard security headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Content-Type-Options', 'nosniff');
      newHeaders.set('X-Frame-Options', 'DENY');
      newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};
