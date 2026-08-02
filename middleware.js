import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ALLOWED_ORIGINS = [
  "https://cb-academy-dz.vercel.app",
  "http://localhost:3000",
  "http://localhost:8081",
  "http://localhost:19006",
];

function getCorsOrigin(origin) {
  if (!origin) return "https://cb-academy-dz.vercel.app";
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  if (process.env.NODE_ENV !== "production" && origin.startsWith("http://localhost:")) {
    return origin;
  }
  return "https://cb-academy-dz.vercel.app";
}

const defaultCorsHeaders = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    const allowOrigin = getCorsOrigin(origin);
    
    const apiHeaders = {
      ...defaultCorsHeaders,
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Credentials": "true",
    };

    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 200, headers: apiHeaders });
    }

    const response = NextResponse.next();
    Object.entries(apiHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const token = req.cookies.get("token")?.value;

  const publicRoutes = ["/", "/login", "/register"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  let decoded;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    decoded = payload;
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = decoded.role?.toLowerCase();

  if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (pathname.startsWith("/dashboard/designer") && role !== "designer") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (pathname.startsWith("/dashboard/teacher") && role !== "teacher") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  if (pathname.startsWith("/dashboard/student") && role !== "student") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};