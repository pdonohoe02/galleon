import { NextResponse, type NextRequest } from "next/server";

import { hostnameFromHostHeader, surfaceForHostname } from "./lib/surface";

export function proxy(request: NextRequest) {
  const hostHeader =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const hostname = hostnameFromHostHeader(hostHeader, request.nextUrl.hostname);
  const surface = surfaceForHostname(hostname);
  const pathname = request.nextUrl.pathname;

  if (surface === "consumer" && !pathname.startsWith("/consumer")) {
    const destination = request.nextUrl.clone();
    destination.pathname = `/consumer${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(destination);
  }

  if (surface === "publisher" && !pathname.startsWith("/publishers")) {
    const destination = request.nextUrl.clone();
    destination.pathname = `/publishers${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(destination);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
