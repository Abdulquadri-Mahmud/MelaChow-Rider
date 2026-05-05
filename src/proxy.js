import { NextResponse } from "next/server";

export function proxy(request) {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL;

  if (!adminUrl) {
    return NextResponse.next();
  }

  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, adminUrl);
  return NextResponse.redirect(target);
}

export const config = {
  matcher: ["/admin/:path*"],
};
