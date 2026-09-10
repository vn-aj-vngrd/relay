import { describe, expect, it } from "vitest";

import { buildBreadcrumbItems } from "./app-breadcrumbs";

describe("buildBreadcrumbItems", () => {
  it("labels subscription requests without displaying IDs or linking to a missing collection route", () => {
    expect(
      buildBreadcrumbItems(
        "/settings/plan/requests/859aab56-17cd-44fc-bd52-716d15c8d93f"
      )
    ).toEqual([
      { href: "/home", label: "Home" },
      { href: "/settings", label: "Settings" },
      { href: "/settings/plan", label: "Plan & billing" },
      { href: undefined, label: "Payment requests" },
      { href: undefined, label: "Payment request" },
    ]);
  });
  it("builds an authenticated collection trail", () => {
    expect(buildBreadcrumbItems("/games")).toEqual([
      { href: "/home", label: "Home" },
      { href: undefined, label: "Games" },
    ]);
  });

  it("keeps the Open games collection in the authenticated breadcrumb trail", () => {
    expect(buildBreadcrumbItems("/games/open")).toEqual([
      { href: "/home", label: "Home" },
      { href: "/games", label: "Games" },
      { href: undefined, label: "Open games" },
    ]);
  });

  it("recognizes Invitations as a collection rather than a game ID", () => {
    expect(buildBreadcrumbItems("/games/invitations")).toEqual([
      { href: "/home", label: "Home" },
      { href: "/games", label: "Games" },
      { href: undefined, label: "Invitations" },
    ]);
  });

  it("defers game detail breadcrumbs to the session layout", () => {
    expect(
      buildBreadcrumbItems(
        "/games/859aab56-17cd-44fc-bd52-716d15c8d93f/payments"
      )
    ).toEqual([]);
  });

  it("uses a concise profile trail instead of exposing the username as navigation", () => {
    expect(buildBreadcrumbItems("/profile/vanajvanguardia")).toEqual([
      { href: "/home", label: "Home" },
      { href: undefined, label: "Profile" },
    ]);
  });

  it("labels feedback as an authenticated support destination", () => {
    expect(buildBreadcrumbItems("/feedback")).toEqual([
      { href: "/home", label: "Home" },
      { href: undefined, label: "Feedback" },
    ]);
  });

  it("uses the canonical court route for court details", () => {
    expect(buildBreadcrumbItems("/courts/central-pickleball")).toEqual([
      { href: "/home", label: "Home" },
      { href: "/courts", label: "Courts" },
      { href: undefined, label: "Court" },
    ]);
  });

  it("uses Courts consistently for admin directory records", () => {
    expect(
      buildBreadcrumbItems("/admin/courts/859aab56-17cd-44fc-bd52-716d15c8d93f")
    ).toEqual([
      { href: "/admin", label: "Admin Console" },
      { href: "/admin/courts", label: "Courts" },
      { href: undefined, label: "Court" },
    ]);
  });

  it("builds admin record trails without exposing ids", () => {
    expect(
      buildBreadcrumbItems(
        "/admin/users/859aab56-17cd-44fc-bd52-716d15c8d93f/edit"
      )
    ).toEqual([
      { href: "/admin", label: "Admin Console" },
      { href: "/admin/users", label: "Users" },
      {
        href: "/admin/users/859aab56-17cd-44fc-bd52-716d15c8d93f",
        label: "User",
      },
      { href: undefined, label: "Edit" },
    ]);
  });
});
