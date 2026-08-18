import { describe, expect, it } from "vitest";
import { buildBreadcrumbItems } from "./app-breadcrumbs";

describe("buildBreadcrumbItems", () => {
  it("builds an authenticated collection trail", () => {
    expect(buildBreadcrumbItems("/games")).toEqual([
      { href: "/home", label: "Home" },
      { href: undefined, label: "Games" },
    ]);
  });

  it("defers game detail breadcrumbs to the session layout", () => {
    expect(buildBreadcrumbItems("/games/859aab56-17cd-44fc-bd52-716d15c8d93f/payments")).toEqual([]);
  });

  it("uses a concise profile trail instead of exposing the username as navigation", () => {
    expect(buildBreadcrumbItems("/profile/vanajvanguardia")).toEqual([
      { href: "/home", label: "Home" },
      { href: undefined, label: "Profile" },
    ]);
  });

  it("builds admin record trails without exposing ids", () => {
    expect(buildBreadcrumbItems("/admin/users/859aab56-17cd-44fc-bd52-716d15c8d93f/edit")).toEqual([
      { href: "/admin", label: "Admin Console" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/users/859aab56-17cd-44fc-bd52-716d15c8d93f", label: "User" },
      { href: undefined, label: "Edit" },
    ]);
  });
});
