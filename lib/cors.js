// lib/cors.js

export const ALLOWED_ORIGINS = [
  'https://cb-academy-dz.vercel.app',
  'http://localhost:3000',
  'http://localhost:8081',
  'http://localhost:19006',
];

export function getCorsOrigin(origin) {
  if (!origin) return 'https://cb-academy-dz.vercel.app';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
    return origin;
  }
  return 'https://cb-academy-dz.vercel.app';
}

export function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  const allowedOrigin = getCorsOrigin(origin);

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}
