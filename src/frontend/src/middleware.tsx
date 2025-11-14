import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function checkOtpToken(request: NextRequest) {
  const token = request.cookies.get("verified_otp_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/account/login", request.url));
  }
  return NextResponse.next();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Đường dẫn verify OTP
  if (pathname.startsWith("/account/verify")) {
    return checkOtpToken(request);
  }
}

export const config = {
  matcher: ["/account/verify/:path*"],
};
