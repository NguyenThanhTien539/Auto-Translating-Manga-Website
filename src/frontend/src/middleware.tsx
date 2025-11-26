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
  // Đã được lọc bởi matcher, nên chỉ cần check token
  return checkOtpToken(request);
}

export const config = {
  matcher: ["/account/verify/:path*", "/account/reset-password/:path*"],
};
