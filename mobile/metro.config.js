// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const https = require('https');

const config = getDefaultConfig(__dirname);

const defaultEnhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (metroMiddleware, server) => {
  const enhanced = defaultEnhanceMiddleware
    ? defaultEnhanceMiddleware(metroMiddleware, server)
    : metroMiddleware;

  return (req, res, next) => {
    // Intercepter les requêtes /api sur le serveur de dev Web pour éviter les blocages CORS du navigateur
    if (req.url && req.url.startsWith('/api')) {
      const targetHost = 'dz-academy-6k34.vercel.app';
      const headers = { ...req.headers };
      headers.host = targetHost;
      headers.origin = `https://${targetHost}`;
      headers.referer = `https://${targetHost}/`;

      const options = {
        hostname: targetHost,
        port: 443,
        path: req.url,
        method: req.method,
        headers,
      };

      const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });

      proxyReq.on('error', (err) => {
        console.error('[Metro Proxy] Erreur lors de la redirection API:', err.message);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Proxy error', details: err.message }));
        }
      });

      req.pipe(proxyReq, { end: true });
      return;
    }

    return enhanced(req, res, next);
  };
};

module.exports = config;
