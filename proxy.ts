import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "./i18n/config";

function getLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && (locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }

  const accept = request.headers.get("accept-language");
  if (accept) {
    const preferred = accept.split(",").map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase());
    for (const lang of preferred) {
      if ((locales as readonly string[]).includes(lang)) return lang;
    }
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );

  if (hasLocale) {
    // Protect dashboard routes: require a session cookie.
    const dashboardMatch = locales.some((l) => pathname.startsWith(`/${l}/dashboard`));
    if (dashboardMatch && !request.cookies.get("pdaftar_session")?.value) {
      const locale = pathname.split("/")[1] || defaultLocale;
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const locale = getLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
