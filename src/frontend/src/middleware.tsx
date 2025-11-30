import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function checkOtpToken(request: NextRequest) {
  const token = request.cookies.get("verified_otp_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/account/login", request.url));
  }

  return NextResponse.next();
}

async function verifyJwt(token: string) {
  const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    console.error("JWT verify error:", err);
    return null;
  }
}

async function checkAdmin(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;

  if (!token) {
    // Chưa login
    return NextResponse.redirect(new URL("/account/login", request.url));
  }

  const payload = await verifyJwt(token);

  if (!payload) {
    return NextResponse.redirect(new URL("/account/login", request.url));
  }

  const role = payload.role as string | undefined;

  if (role !== "0") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Bảo vệ route admin
  if (pathname.startsWith("/admin")) {
    return checkAdmin(request);
  }

  // 2. Bảo vệ verify/reset password bằng OTP
  if (
    pathname.startsWith("/account/verify") ||
    pathname.startsWith("/account/reset-password")
  ) {
    return checkOtpToken(request);
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    `/admin/:path*`, // check admin
    "/account/verify/:path*", // check otp
    "/account/reset-password/:path*", // check otp
  ],
};
