import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/pair") ||
    pathname.startsWith("/settings");
  if (!req.auth && isProtected) {
    const url = new URL("/", req.nextUrl);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/pair/:path*", "/settings/:path*"],
};
