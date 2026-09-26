"use client";

import { usePathname } from "next/navigation";

import { FocusedMobileHeader } from "./focused-mobile-header";

type SecondaryMobileRoute = {
  title: string;
  backHref: string;
  backLabel: string;
  heading?: boolean;
};

export function secondaryMobileRoute(
  pathname: string,
  username: string
): SecondaryMobileRoute | null {
  const profileHref = `/profile/${username}`;
  const profilePath = /^\/profile\/[^/]+(?:\/(edit|insights))?$/;
  const profileMatch = profilePath.exec(pathname);
  if (profileMatch) {
    if (profileMatch[1] === "insights") return null;
    if (profileMatch[1] === "edit")
      return {
        title: "Edit profile",
        backHref: profileHref,
        backLabel: "Back to profile",
      };
    return {
      title: "Profile",
      backHref: "/home",
      backLabel: "Back to Home",
      heading: false,
    };
  }

  if (pathname === "/search")
    return { title: "Search", backHref: "/home", backLabel: "Back to Home" };
  if (pathname === "/notifications")
    return {
      title: "Notifications",
      backHref: "/home",
      backLabel: "Back to Home",
    };
  if (pathname === "/feedback")
    return {
      title: "Send feedback",
      backHref: profileHref,
      backLabel: "Back to profile",
    };
  if (pathname === "/settings")
    return {
      title: "Settings",
      backHref: profileHref,
      backLabel: "Back to profile",
    };
  if (pathname === "/settings/password")
    return {
      title: "Change password",
      backHref: "/settings",
      backLabel: "Back to settings",
    };
  if (pathname === "/settings/plan")
    return {
      title: "Plan & billing",
      backHref: "/settings",
      backLabel: "Back to settings",
    };
  if (pathname === "/settings/plan/media")
    return {
      title: "Hosted-game photos",
      backHref: "/settings/plan",
      backLabel: "Back to Plan & billing",
    };
  if (/^\/settings\/plan\/requests\/[^/]+$/.test(pathname))
    return {
      title: "Payment request",
      backHref: "/settings/plan",
      backLabel: "Back to Plan & billing",
    };
  if (pathname === "/courts")
    return { title: "Courts", backHref: "/home", backLabel: "Back to Home" };
  if (pathname === "/help")
    return {
      title: "Help Center",
      backHref: profileHref,
      backLabel: "Back to profile",
    };
  if (/^\/help\/[^/]+$/.test(pathname))
    return {
      title: "Help Center",
      backHref: "/help",
      backLabel: "Back to Help Center",
      heading: false,
    };
  if (pathname === "/courts/suggest")
    return {
      title: "Suggest a court",
      backHref: "/courts",
      backLabel: "Back to Courts",
    };
  if (/^\/courts\/[^/]+$/.test(pathname))
    return {
      title: "Court",
      backHref: "/courts",
      backLabel: "Back to Courts",
      heading: false,
    };
  return null;
}

export function SecondaryMobileHeader({ username }: { username: string }) {
  const route = secondaryMobileRoute(usePathname(), username);
  if (!route) return null;

  return (
    <div className="secondary-mobile-header lg:hidden">
      <FocusedMobileHeader
        title={route.title}
        isAuthenticated
        backHref={route.backHref}
        backLabel={route.backLabel}
        heading={route.heading ?? true}
      />
    </div>
  );
}
