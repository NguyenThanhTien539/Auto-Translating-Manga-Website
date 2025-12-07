import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

type PayloadWithRole = JWTPayload & {
  role?: string;
};

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

async function verifyJwtFromRequest(
  request: NextRequest,
  cookieName = "accessToken"
): Promise<PayloadWithRole | null> {
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as PayloadWithRole;
  } catch (err) {
    console.error("JWT verify error:", err);
    return null;
  }
}

// Check OTP cho các bước verify / reset password
function requireOtpToken(request: NextRequest) {
  const token = request.cookies.get("verified_otp_token")?.value;
  if (!token) {
    return redirectTo(request, "/account/login");
  }
  return NextResponse.next();
}

// Check admin (role === "0")
async function requireAdmin(request: NextRequest) {
  const payload = await verifyJwtFromRequest(request);
  if (!payload) {
    // Chưa login hoặc token sai
    return redirectTo(request, "/account/login");
  }

  if (payload.role !== "0") {
    // Không phải admin
    return redirectTo(request, "/");
  }

  return NextResponse.next();
}

// Check user chỉ cần login (không check role)
async function requireUser(request: NextRequest) {
  const payload = await verifyJwtFromRequest(request);
  if (!payload) {
    // Chưa login
    return redirectTo(request, "/");
  }

  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Bảo vệ route admin
  if (pathname.startsWith("/admin")) {
    return requireAdmin(request);
  }

  // 2. Bảo vệ verify/reset password bằng OTP
  if (
    pathname.startsWith("/account/verify") ||
    pathname.startsWith("/account/reset-password")
  ) {
    return requireOtpToken(request);
  }

  // 3. Bảo vệ route profile (user phải login)
  if (pathname.startsWith("/profile")) {
    return requireUser(request);
  }

  if(pathname.startsWith("/order")){
    return requireUser(request);
  }

  // 4. Mặc định cho qua
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*", // check admin
    "/account/verify/:path*", // check otp
    "/account/reset-password/:path*", // check otp
    "/profile/:path*", // check user
    "/order/:path"
  ],
};
